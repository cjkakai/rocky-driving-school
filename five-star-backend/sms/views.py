from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from students.models import Student
from services.sms_service import send_sms
from .models import SMSLog


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def broadcast(request):
    if request.user.role not in ("super_admin",):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    student_ids = request.data.get("student_ids", [])
    message = request.data.get("message", "").strip()

    if not student_ids or not message:
        return Response(
            {"detail": "student_ids and message are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    students = list(Student.objects.filter(id__in=student_ids).values("id", "phone"))
    if not students:
        return Response({"detail": "No students found."}, status=status.HTTP_404_NOT_FOUND)

    # Send all SMS first (no DB writes during the loop)
    results = []
    for s in students:
        result = send_sms(s["phone"], message)
        results.append((s["phone"], result))

    # Bulk insert all logs in a single DB write
    logs = []
    sent, failed = 0, 0
    for phone, result in results:
        data = result.get("data", {})
        msg_id = ""
        if result["success"] and isinstance(data, dict):
            recipients = data.get("Data", [])
            if recipients:
                msg_id = str(recipients[0].get("MessageId", ""))
        logs.append(SMSLog(
            phone=phone,
            message=message,
            message_id=msg_id,
            status="sent" if result["success"] else "failed",
            response=result,
        ))
        if result["success"]:
            sent += 1
        else:
            failed += 1

    SMSLog.objects.bulk_create(logs)
    return Response({"sent": sent, "failed": failed})


@api_view(["GET"])
@permission_classes([AllowAny])
def sms_dlr(request):
    message_id = request.query_params.get("messageId", "")
    raw_status = request.query_params.get("status", "")
    mobile = request.query_params.get("mobile", "")

    dlr_status = "delivered" if str(raw_status) in ("1", "delivered") else "failed"

    if message_id:
        SMSLog.objects.filter(message_id=message_id).update(status=dlr_status)

    return Response({"detail": "ok"})
