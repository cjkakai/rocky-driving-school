from django.db import models


class SMSLog(models.Model):
    phone = models.CharField(max_length=20)
    message = models.TextField()
    message_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default="pending")
    response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone} – {self.status} – {self.created_at:%Y-%m-%d %H:%M}"
