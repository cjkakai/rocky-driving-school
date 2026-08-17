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

    # Only two genuinely manual inputs remain — everything else is live-computed
    inquiries = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]
        unique_together = ("branch", "report_date")
        indexes = [
            models.Index(fields=["branch", "report_date"]),
            models.Index(fields=["report_date"]),
        ]

    def __str__(self):
        return f"{self.branch} | {self.report_date}"


class TripEntry(models.Model):
    """
    Legacy per-trip records from the old report-submission flow.
    No longer written to on report creation — Lesson (academics app) is now
    the source of truth for vehicle/trip data. Kept only so existing rows
    aren't orphaned; safe to drop in a future cleanup migration once that
    historical data has been migrated or archived.
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