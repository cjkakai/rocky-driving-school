from rest_framework import serializers
from .models import PDLBooking, Exam, ExamBooking, ExamResult


class PDLBookingSerializer(serializers.ModelSerializer):
    booking_date = serializers.DateField(read_only=True)

    class Meta:
        model = PDLBooking
        fields = [
            "id", "student", "student_course", "booked_by", "approved_by",
            "booking_date", "status", "notes", "approved_at", "created_at", "updated_at",
        ]
        read_only_fields = ["booked_by", "approved_by", "student", "booking_date"]


class ExamResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamResult
        fields = ["id", "exam_booking", "result", "score", "recorded_by", "recorded_at"]
        read_only_fields = ["recorded_by"]


class ExamBookingSerializer(serializers.ModelSerializer):
    exam_name = serializers.SerializerMethodField()
    exam_date = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_admission = serializers.CharField(source="student.admission_number", read_only=True)
    student_phone = serializers.CharField(source="student.phone", read_only=True)
    student_id_number = serializers.CharField(source="student.id_number", read_only=True)
    branch_name = serializers.CharField(source="student.branch.name", read_only=True)
    course_name = serializers.CharField(source="student_course.course.class_name", read_only=True)
    student_course_status = serializers.CharField(source="student_course.status", read_only=True)
    result = serializers.SerializerMethodField()

    def get_exam_name(self, obj):
        return obj.exam.exam_name if obj.exam else None

    def get_exam_date(self, obj):
        return obj.exam.exam_date if obj.exam else None

    def get_result(self, obj):
        try:
            return obj.result.result
        except ExamResult.DoesNotExist:
            return None

    class Meta:
        model = ExamBooking
        fields = [
            "id", "student_course", "student", "exam", "exam_name", "exam_date",
            "status", "booked_by", "approved_by", "approved_at",
            "admin1_comment", "admin2_comment",
            "created_at", "updated_at",
            "student_name", "student_admission", "student_phone", "student_id_number",
            "branch_name", "course_name", "student_course_status", "result",
        ]
        read_only_fields = ["booked_by", "student"]


class ExamSerializer(serializers.ModelSerializer):
    booking_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Exam
        fields = ["id", "exam_name", "exam_date", "test_center", "status", "created_by", "created_at", "booking_count"]
        read_only_fields = ["created_by", "status"]
