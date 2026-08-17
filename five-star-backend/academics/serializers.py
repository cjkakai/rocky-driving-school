from rest_framework import serializers
from .models import Course, StudentCourse, Lesson, Instructor
from vehicles.models import Vehicle


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "category", "class_name", "lessons", "amount", "max_discount", "is_refresher_course", "is_active_for_registration"]

    def validate(self, data):
        amount = data.get("amount", getattr(self.instance, "amount", None))
        max_discount = data.get("max_discount", getattr(self.instance, "max_discount", 0))
        if "category" in data and not data["category"].strip():
            raise serializers.ValidationError({"category": "Category is required."})
        if "class_name" in data and not data["class_name"].strip():
            raise serializers.ValidationError({"class_name": "Class name is required."})
        if "lessons" in data and data.get("lessons", 0) < 0:
            raise serializers.ValidationError({"lessons": "Lessons must be 0 or more."})
        if "amount" in data and amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        if "max_discount" in data and max_discount is not None and max_discount < 0:
            raise serializers.ValidationError({"max_discount": "Max discount cannot be negative."})
        if amount is not None and max_discount is not None and max_discount > amount:
            raise serializers.ValidationError({"max_discount": "Max discount cannot exceed amount."})
        return data


class PaymentInCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    reference_code = serializers.CharField()
    created_at = serializers.DateTimeField()


class ExamBookingInCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    exam_id = serializers.SerializerMethodField()
    exam_name = serializers.SerializerMethodField()
    exam_date = serializers.SerializerMethodField()
    status = serializers.CharField()

    def get_exam_id(self, obj):
        return obj.exam.id if obj.exam else None

    def get_exam_name(self, obj):
        return obj.exam.exam_name if obj.exam else None

    def get_exam_date(self, obj):
        return obj.exam.exam_date if obj.exam else None


class StudentCourseSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.class_name", read_only=True)
    course_amount = serializers.DecimalField(source="course.amount", max_digits=10, decimal_places=2, read_only=True)
    is_refresher_course = serializers.BooleanField(source="course.is_refresher_course", read_only=True)
    payments = PaymentInCourseSerializer(many=True, read_only=True)
    payment_reference = serializers.CharField(read_only=True, allow_blank=True)
    balance = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    exam_booking = serializers.SerializerMethodField()
    pdl_state = serializers.SerializerMethodField()

    def get_balance(self, obj):
        agreed = obj.amount_agreed or 0
        paid = sum(p.amount for p in obj.payments.filter(status="completed"))
        return agreed - paid

    def get_total_paid(self, obj):
        return sum(p.amount for p in obj.payments.filter(status="completed"))

    def get_exam_booking(self, obj):
        eb = obj.exam_bookings.filter(exam__isnull=False).order_by("-created_at").first()
        return ExamBookingInCourseSerializer(eb).data if eb else None

    def get_pdl_state(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        if obj.pdl_bookings.filter(status="pending").exists():
            return "pending"
        pdl = obj.pdl_bookings.filter(status="approved").order_by("-approved_at").first()
        if not pdl:
            return "none"
        if pdl.approved_at and timezone.now() > pdl.approved_at + timedelta(days=90):
            return "expired"
        return "active"

    class Meta:
        model = StudentCourse
        fields = [
            "id", "student", "course", "course_name", "course_amount", "is_refresher_course",
            "status", "amount_agreed", "discount", "payment_reference",
            "balance", "total_paid", "payments", "exam_booking", "pdl_state",
            "exam_attempt_count", "last_exam_result",
            "registration_date", "updated_at",
        ]


class InstructorSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Instructor
        fields = ["id", "full_name", "phone", "licence_number", "branch", "branch_name", "is_active"]


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["id", "registration_number", "vehicle_name", "vehicle_type"]


class LessonSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    vehicle_display = serializers.SerializerMethodField()
    course_name = serializers.CharField(source="student_course.course.class_name", read_only=True)

    def get_instructor_name(self, obj):
        return obj.instructor.full_name if obj.instructor else None

    def get_vehicle_display(self, obj):
        if not obj.vehicle:
            return None
        return f"{obj.vehicle.registration_number} — {obj.vehicle.vehicle_name}"

    class Meta:
        model = Lesson
        fields = [
            "id", "student_course", "student", "branch",
            "instructor", "instructor_name",
            "vehicle", "vehicle_display",
            "date", "start_time", "end_time", "duration_minutes",
            "lesson_type", "status", "notes", "instructor_remarks",
            "course_name", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["student", "branch", "duration_minutes", "created_by", "created_at", "updated_at"]

    def validate(self, data):
        start = data.get("start_time")
        end = data.get("end_time")
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return data
