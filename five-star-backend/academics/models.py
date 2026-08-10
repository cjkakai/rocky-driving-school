from django.db import models
from django.utils import timezone


class Course(models.Model):
    category = models.CharField(max_length=255)
    class_name = models.CharField(max_length=100)
    lessons = models.CharField(max_length=255)
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
        ("exam_booked",          "Exam List"),
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
