from django.db import models
from django.utils import timezone


class Student(models.Model):
    STATUS_CHOICES = [
        ("active",    "Active"),
        ("dormant",   "Dormant"),
        ("offloaded", "Offloaded"),
    ]

    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.CASCADE, related_name="students"
    )
    admission_number = models.CharField(max_length=100, unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, db_index=True)
    id_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active", db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
