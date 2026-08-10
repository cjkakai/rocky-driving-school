from django.db import models
from django.conf import settings


class RevenueTarget(models.Model):
    branch = models.ForeignKey("branches.Branch", on_delete=models.CASCADE, related_name="revenue_targets")
    year = models.PositiveSmallIntegerField()
    week = models.PositiveSmallIntegerField()  # ISO week 1–53
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("branch", "year", "week")
        indexes = [models.Index(fields=["year", "week"])]

    def __str__(self):
        return f"{self.branch} — W{self.week}/{self.year} target: {self.target_amount}"


class RegistrationTarget(models.Model):
    branch = models.ForeignKey("branches.Branch", on_delete=models.CASCADE, related_name="registration_targets")
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()  # 1–12
    target_count = models.PositiveIntegerField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("branch", "year", "month")
        indexes = [models.Index(fields=["year", "month"])]

    def __str__(self):
        return f"{self.branch} — {self.year}-{self.month:02d} target: {self.target_count}"
