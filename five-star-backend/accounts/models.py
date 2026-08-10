import uuid
import random
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ("super_admin", "Super Admin"),
        ("branch_user", "Branch User"),
    ]

    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=11, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="branch_user")
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class Session(models.Model):
    DEVICE_CHOICES = [("mobile", "Mobile"), ("desktop", "Desktop")]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
    )
    date = models.DateField(auto_now_add=True)
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    device = models.CharField(max_length=10, choices=DEVICE_CHOICES, default="desktop")

    def __str__(self):
        return f"{self.user.username} ({self.date}) - {self.start_time} - {self.end_time}"


class PasswordResetOTP(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_otps")
    phone_number = models.CharField(max_length=30)
    otp = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_created"]

    def __str__(self):
        return f"{self.phone_number} - {self.otp}"

    @classmethod
    def generate_otp(cls):
        return str(random.randint(100000, 999999))

    def is_expired(self):
        return timezone.now() > self.expires_at