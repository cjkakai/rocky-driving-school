from datetime import date, timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from services.sms_service import send_sms
from .serializers import LoginSerializer, UserSerializer, CreateUserSerializer, ChangePasswordSerializer, \
    SessionSerializer, ResetPasswordWithOTPSerializer, VerifyPasswordResetOTPSerializer, \
    RequestPasswordResetOTPSerializer
from .models import User, Session, PasswordResetOTP


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Session.objects.filter(
            user=request.user,
            end_time__isnull=True,
        ).update(end_time=timezone.localtime().time())

        return Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class UserListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "super_admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.select_related("branch").all().order_by("username")
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        if request.user.role != "super_admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != "super_admin":
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response({"detail": "Cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password changed successfully."})


class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Match the existing super_admin-only pattern.
        # If you want branch users to see their own branch, see note below.
        if request.user.role != "super_admin":
            return Response(
                {"detail": "Forbidden."},
                status=status.HTTP_403_FORBIDDEN,
            )

        date_param = request.query_params.get("date")
        if date_param:
            try:
                filter_date = date.fromisoformat(date_param)
            except ValueError:
                return Response(
                    {"date": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            filter_date = timezone.localdate()

        sessions = (
            Session.objects
            .select_related("user", "user__branch")
            .filter(date=filter_date)
            .order_by("-start_time")
        )

        return Response({
            "date": filter_date.isoformat(),
            "count": sessions.count(),
            "results": SessionSerializer(sessions, many=True).data,
        })


def normalize_phone_number(phone_number):
    phone_number = str(phone_number).strip().replace(" ", "")

    if phone_number.startswith("0"):
        return "254" + phone_number[1:]

    if phone_number.startswith("+"):
        return phone_number[1:]

    return phone_number


class RequestPasswordResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = normalize_phone_number(serializer.validated_data["phone_number"])

        user = User.objects.filter(phone_number=phone_number).first()

        # Optional fallback if your DB stores phone as 07...
        if not user and phone_number.startswith("254"):
            local_phone = "0" + phone_number[3:]
            user = User.objects.filter(phone_number=local_phone).first()

        if not user:
            return Response(
                {"phone_number": "No user found with this phone number."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Expire old unused OTPs for this user
        PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        otp = PasswordResetOTP.generate_otp()

        PasswordResetOTP.objects.create(
            user=user,
            phone_number=phone_number,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        message = f"Your password reset OTP is {otp}. It expires in 10 minutes."

        send_sms(phone_number, message)

        return Response(
            {"detail": "OTP sent successfully."},
            status=status.HTTP_200_OK,
        )


class VerifyPasswordResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyPasswordResetOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = normalize_phone_number(serializer.validated_data["phone_number"])
        otp = serializer.validated_data["otp"]

        otp_record = PasswordResetOTP.objects.filter(
            phone_number=phone_number,
            otp=otp,
            is_used=False,
        ).first()

        if not otp_record:
            return Response(
                {"otp": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.is_expired():
            return Response(
                {"otp": "OTP has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "OTP verified successfully."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordWithOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordWithOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = normalize_phone_number(serializer.validated_data["phone_number"])
        otp = serializer.validated_data["otp"]
        new_password = serializer.validated_data["new_password"]

        otp_record = PasswordResetOTP.objects.select_related("user").filter(
            phone_number=phone_number,
            otp=otp,
            is_used=False,
        ).first()

        if not otp_record:
            return Response(
                {"otp": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_record.is_expired():
            return Response(
                {"otp": "OTP has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = otp_record.user
        user.set_password(new_password)
        user.save()

        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        return Response(
            {"detail": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )