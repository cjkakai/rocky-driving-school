from django.db import models
from django.utils import timezone


class Course(models.Model):
    category = models.CharField(max_length=255)
    class_name = models.CharField(max_length=100)
    lessons = models.PositiveSmallIntegerField(default=0)
    practical_lessons = models.PositiveSmallIntegerField(default=0)
    theory_lessons = models.PositiveSmallIntegerField(default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_refresher_course = models.BooleanField(default=False)
    is_active_for_registration = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} – {self.class_name}"


class StudentCourse(models.Model):
    STATUS_CHOICES = [
        ("onboarded",            "Onboarded"),
        ("pending_pdl",          "Pending PDL"),
        ("active",               "Active"),
        ("pending_exam_booking", "Pending Exam"),
        ("exam_list",            "Exam List"),
        ("exam_approved",        "Exam Approved"),
        ("failed",               "Failed"),
        ("retake_booked",        "Retake Booked"),
        ("completed",            "Completed"),
        ("dormant",              "Dormant"),
        ("transferred",          "Transferred"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="student_courses"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="student_courses")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="onboarded", db_index=True)
    amount_agreed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_reference = models.CharField(max_length=50, blank=True)
    registration_date = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    exam_attempt_count = models.PositiveSmallIntegerField(default=0)
    last_exam_result = models.CharField(max_length=10, blank=True, default="")

    def __str__(self):
        return f"{self.student} - {self.course}"


class CourseTransfer(models.Model):
    from django.conf import settings

    old_student_course = models.ForeignKey(
        StudentCourse, on_delete=models.PROTECT,
        related_name="transfers_out",
    )
    new_student_course = models.ForeignKey(
        StudentCourse, on_delete=models.PROTECT,
        related_name="transfers_in",
    )
    credit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True)
    transferred_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True,
    )
    transferred_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transfer {self.old_student_course_id} → {self.new_student_course_id}"


class Instructor(models.Model):
    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.CASCADE, related_name="instructors"
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    licence_number = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Lesson(models.Model):
    STATUS_CHOICES = [
        ("completed",  "Completed"),
        ("scheduled",  "Scheduled"),
        ("cancelled",  "Cancelled"),
        ("no_show",    "No Show"),
    ]

    student_course = models.ForeignKey(
        StudentCourse, on_delete=models.CASCADE, related_name="lessons"
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="lessons"
    )
    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.SET_NULL, null=True, blank=True
    )
    instructor = models.ForeignKey(
        Instructor, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="lessons"
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.SET_NULL, null=True, blank=True
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=0)
    lesson_type = models.CharField(
        max_length=50,
        choices=[("practical", "Practical"), ("theory", "Theory")],
        default="practical",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    notes = models.TextField(blank=True)
    instructor_remarks = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True,
        related_name="lessons_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-start_time"]
        indexes = [
            models.Index(fields=["student", "date"]),
            models.Index(fields=["student_course", "status"]),
        ]

    def save(self, *args, **kwargs):
        # Enforce: theory lessons must never have a vehicle
        if self.lesson_type == "theory":
            self.vehicle = None
            self.vehicle_id = None
        if self.start_time and self.end_time:
            from datetime import datetime, date as date_type
            d = self.date if isinstance(self.date, date_type) else date_type.today()
            start_dt = datetime.combine(d, self.start_time)
            end_dt = datetime.combine(d, self.end_time)
            diff = (end_dt - start_dt).total_seconds() / 60
            self.duration_minutes = max(0, int(diff))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Lesson {self.student} on {self.date}"
