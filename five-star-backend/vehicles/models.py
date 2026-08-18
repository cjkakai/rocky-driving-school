from django.db import models
from branches.models import Branch


class Vehicle(models.Model):
    INSURANCE_STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("EXPIRED", "Expired"),
    ]
    INSPECTION_STATUS_CHOICES = [
        ("DUE", "Due"),
        ("NOT_DUE", "Not Due"),
    ]

    registration_number = models.CharField(max_length=20, unique=True, db_index=True)
    vehicle_name = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50)
    insurance_status = models.CharField(
        max_length=10, choices=INSURANCE_STATUS_CHOICES, default="ACTIVE", db_index=True
    )
    insurance_expiry_date = models.DateField(null=True, blank=True, db_index=True)
    inspection_status = models.CharField(
        max_length=10, choices=INSPECTION_STATUS_CHOICES, default="NOT_DUE", db_index=True
    )
    inspection_due_date = models.DateField(null=True, blank=True)
    branch = models.ForeignKey(
        Branch, null=True, blank=True, on_delete=models.SET_NULL, related_name="vehicles"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["registration_number"]
        indexes = [
            models.Index(fields=["insurance_status"]),
            models.Index(fields=["inspection_status"]),
        ]

    def __str__(self):
        return f"{self.registration_number} — {self.vehicle_name}"
