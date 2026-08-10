from rest_framework import serializers
from .models import Student
from branches.models import Branch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "branch_code", "location"]


class PaymentInCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    payment_type = serializers.CharField()
    reference_code = serializers.CharField()
    mpesa_reference = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()


class ExamBookingInCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    exam_id = serializers.SerializerMethodField()
    exam_name = serializers.SerializerMethodField()
    exam_date = serializers.SerializerMethodField()
    status = serializers.CharField()
    result = serializers.SerializerMethodField()

    def get_exam_id(self, obj):
        return obj.exam.id if obj.exam else None

    def get_exam_name(self, obj):
        return obj.exam.exam_name if obj.exam else None

    def get_exam_date(self, obj):
        return obj.exam.exam_date if obj.exam else None

    def get_result(self, obj):
        try:
            return obj.result.result  # "pass" / "fail" / "absent"
        except Exception:
            return None


class StudentCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    course_id = serializers.IntegerField(source="course.id")
    course_name = serializers.CharField(source="course.class_name")
    is_refresher_course = serializers.BooleanField(source="course.is_refresher_course")
    status = serializers.CharField()
    amount_agreed = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = serializers.CharField()
    registration_date = serializers.DateTimeField()
    payments = PaymentInCourseSerializer(many=True)
    balance = serializers.SerializerMethodField()
    pdl_state = serializers.SerializerMethodField()
    pending_pdl_booking_id = serializers.SerializerMethodField()
    exam_booking = serializers.SerializerMethodField()
    exam_attempt_count = serializers.IntegerField()
    last_exam_result = serializers.CharField()

    def get_pending_pdl_booking_id(self, obj):
        pdl = obj.pdl_bookings.filter(status="pending").first()
        return pdl.id if pdl else None

    def get_balance(self, obj):
        agreed = obj.amount_agreed or 0
        paid = sum(p.amount for p in obj.payments.filter(status="completed"))
        return agreed - paid

    def get_pdl_state(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        from students.lifecycle import get_course_pdl, is_pdl_expired

        if obj.pdl_bookings.filter(status="pending").exists():
            return "pending"

        pdl = get_course_pdl(obj)
        if not pdl:
            return "none"
        return "expired" if is_pdl_expired(pdl) else "active"

    def get_exam_booking(self, obj):
        eb = obj.exam_bookings.filter(exam__isnull=False).order_by("-created_at").first()
        if not eb:
            return None
        return ExamBookingInCourseSerializer(eb).data


class PDLBookingSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    student_course = serializers.IntegerField(source="student_course.id", allow_null=True)
    status = serializers.CharField()
    booking_date = serializers.DateField()
    approved_at = serializers.DateTimeField(allow_null=True)


class StudentSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source="branch", write_only=True
    )
    admission_number = serializers.CharField(read_only=True)  # immutable after creation
    student_courses = StudentCourseSerializer(many=True, read_only=True)
    pdl_bookings = PDLBookingSummarySerializer(many=True, read_only=True)
    course_progress_summary = serializers.SerializerMethodField()

    def get_course_progress_summary(self, obj):
        """
        Returns a list of {status, count} for display in the table.
        Transferred courses are excluded — they are terminal and should not
        appear as active pipeline stages.
        """
        from collections import Counter
        courses = obj.student_courses.exclude(status="transferred")
        counts = Counter(sc.status for sc in courses)
        return [{"status": s, "count": c} for s, c in counts.items()]

    class Meta:
        model = Student
        fields = [
            "id",
            "admission_number",
            "full_name",
            "phone",
            "id_number",
            "status",
            "branch",
            "branch_id",
            "student_courses",
            "pdl_bookings",
            "course_progress_summary",
            "created_at",
            "updated_at",
        ]
