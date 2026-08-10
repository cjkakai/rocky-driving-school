from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Session


import re

MOBILE_UA_RE = re.compile(r"Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini", re.I)


def detect_device(request):
    ua = (request.META.get("HTTP_USER_AGENT") or "") if request else ""
    return "mobile" if MOBILE_UA_RE.search(ua) else "desktop"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if user.is_active is False:
            raise serializers.ValidationError("Account is disabled.")
        refresh = RefreshToken.for_user(user)
        device = detect_device(self.context.get("request"))
        session = Session.objects.filter(user=user, date=timezone.now().date()).first()
        if not session:
            Session.objects.create(user=user, date=timezone.now().date(), start_time=timezone.localtime().time(), device=device)
        else:
            session.end_time = None
            session.device = device
            session.save()
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "branch_id": user.branch_id,
            "branch_name": user.branch.name if user.branch else None,
        }


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "phone_number", "role", "branch", "branch_name", "is_active"]


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "phone_number", "password", "role", "branch"]

    def validate(self, data):
        role = data.get("role", "branch_user")
        if role == "branch_user" and not data.get("branch"):
            raise serializers.ValidationError({"branch": "Branch is required for branch users."})
        if role == "super_admin":
            if not data.get("email"):
                raise serializers.ValidationError({"email": "Email is required for super admin."})
            if User.objects.filter(role="super_admin").exists():
                raise serializers.ValidationError("A super admin already exists.")
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class SessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    branch = serializers.CharField(source="user.branch.name", read_only=True, default=None)

    class Meta:
        model = Session
        fields = ["id", "username", "branch", "date", "start_time", "end_time", "device"]


class RequestPasswordResetOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=30)


class VerifyPasswordResetOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=30)
    otp = serializers.CharField(max_length=6)


class ResetPasswordWithOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=30)
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6, write_only=True)