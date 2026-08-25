from django.db import models
from django.conf import settings


class PDLBooking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="pdl_bookings"
    )
    student_course = models.ForeignKey(
        "academics.StudentCourse", on_delete=models.CASCADE,
        related_name="pdl_bookings", null=True, blank=True
    )
    booked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="pdl_bookings_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="pdl_bookings_approved"
    )
    booking_date = models.DateField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True)
    pdl_reminder_sent = models.BooleanField(default=False)
    # PDL document details — captured from the physical PDL issued to the student
    reference_number = models.CharField(max_length=100, blank=True, default="")
    issued_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PDL {self.student} - {self.status}"


class Exam(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("closed", "Closed"),
    ]

    exam_name = models.CharField(max_length=255)
    exam_date = models.DateField()
    test_center = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="exams_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.exam_name


class ExamBooking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
    ]

    student_course = models.ForeignKey(
        "academics.StudentCourse", on_delete=models.CASCADE,
        related_name="exam_bookings", null=True, blank=True
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="exam_bookings",
        null=True, blank=True
    )
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="bookings", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    booked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="exam_bookings_created"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="exam_bookings_approved"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    admin1_comment = models.TextField(blank=True)
    admin2_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_course or self.student} - {self.exam}"


class ExamResult(models.Model):
    RESULT_CHOICES = [
        ("pass", "Pass"),
        ("fail", "Fail"),
        ("absent", "Absent"),
    ]

    exam_booking = models.OneToOneField(ExamBooking, on_delete=models.CASCADE, related_name="result")
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="exam_results_recorded"
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.exam_booking} - {self.result}"
