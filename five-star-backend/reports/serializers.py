from rest_framework import serializers
from .models import Report, PracticalLesson


class ReportSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    vehicle_registration = serializers.CharField(
        source="vehicle.registration_number", read_only=True, default=None
    )
    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_name", read_only=True, default=None
    )

    class Meta:
        model = Report
        fields = [
            "id", "branch", "branch_name", "created_by", "created_by_name",
            "report_date",
            "inquiries", "practical_manual_lessons", "practical_automatic_lessons", "attendance",
            "vehicle", "vehicle_registration", "vehicle_name", "number_of_trips",
            "student_registrations", "student_course_registrations",
            "payment_count", "payment_total",
            "exam_bookings_count", "pdl_bookings_count",
            "course_breakdown",
            "created_at",
        ]
        read_only_fields = [
            "branch", "created_by",
            "student_registrations", "student_course_registrations",
            "payment_count", "payment_total",
            "exam_bookings_count", "pdl_bookings_count",
            "course_breakdown", "created_at",
        ]


class PracticalLessonSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    vehicle_registration = serializers.CharField(
        source="vehicle.registration_number", read_only=True, default=None
    )
    vehicle_display = serializers.CharField(
        source="vehicle.vehicle_name", read_only=True, default=None
    )
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = PracticalLesson
        fields = [
            "id", "lesson_type", "branch", "branch_name",
            "vehicle", "vehicle_registration", "vehicle_display",
            "number_of_students", "number_of_trips",
            "date", "notes", "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by", "branch_name",
                            "vehicle_registration", "vehicle_display", "created_by_name"]
