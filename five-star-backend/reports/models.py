from django.db import models
from django.conf import settings


class Report(models.Model):
    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.CASCADE, related_name="reports"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="reports_created"
    )
    report_date = models.DateField(db_index=True)

    # Manual operational inputs
    inquiries = models.PositiveIntegerField(default=0)
    practical_manual_lessons = models.PositiveIntegerField(default=0)
    practical_automatic_lessons = models.PositiveIntegerField(default=0)
    attendance = models.PositiveIntegerField(default=0)

    # Vehicle + trips tracking for practical lessons
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        db_index=True,
    )
    number_of_trips = models.PositiveIntegerField(default=0)

    # Snapshot aggregate totals — frozen at submission time
    student_registrations = models.PositiveIntegerField(default=0)
    student_course_registrations = models.PositiveIntegerField(default=0)
    payment_count = models.PositiveIntegerField(default=0)
    payment_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    exam_bookings_count = models.PositiveIntegerField(default=0)
    pdl_bookings_count = models.PositiveIntegerField(default=0)

    course_breakdown = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]
        unique_together = ("branch", "report_date")
        indexes = [
            models.Index(fields=["branch", "report_date"]),
            models.Index(fields=["report_date"]),
            models.Index(fields=["vehicle", "report_date"]),
        ]

    def __str__(self):
        return f"{self.branch} | {self.report_date}"


class PracticalLesson(models.Model):
    LESSON_TYPE_CHOICES = [
        ("PRACTICAL_MANUAL", "Practical Manual"),
        ("PRACTICAL_AUTOMATIC", "Practical Automatic"),
    ]

    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPE_CHOICES, db_index=True)
    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.CASCADE, related_name="practical_lessons"
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="practical_lessons",
        db_index=True,
    )
    number_of_students = models.PositiveIntegerField(default=0)
    number_of_trips = models.PositiveIntegerField(default=0)
    date = models.DateField(db_index=True)
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="practical_lessons_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["branch", "date"]),
            models.Index(fields=["vehicle", "date"]),
            models.Index(fields=["lesson_type", "date"]),
        ]

    def __str__(self):
        return f"{self.get_lesson_type_display()} | {self.branch} | {self.date}"


class TripEntry(models.Model):
    """
    One practical driving trip recorded as part of a daily report.

    Each row = one vehicle run during the day.
    The same vehicle can appear multiple times (multiple trips).
    trip count  = TripEntry.objects.filter(report=report).count()
    student sum = TripEntry.objects.filter(report=report).aggregate(Sum('number_of_students'))
    """
    report  = models.ForeignKey(
        "Report",
        on_delete=models.CASCADE,
        related_name="trip_entries",
    )
    vehicle = models.ForeignKey(
        "vehicles.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="trip_entries",
    )
    number_of_students = models.PositiveIntegerField(default=0)
    number_of_lessons  = models.PositiveIntegerField(default=0)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        reg = self.vehicle.registration_number if self.vehicle else "no vehicle"
        return f"{self.report.report_date} | {reg} | {self.number_of_students} students | {self.number_of_lessons} lessons"
