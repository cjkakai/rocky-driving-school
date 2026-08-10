"""
Scheduled jobs — wire these up with django-apscheduler or celery-beat.

  Weekly balance reminder  → every Sunday 16:00
  PDL expiry reminder      → daily

To run manually:
  from sms.jobs import send_weekly_balance_reminders, send_pdl_expiry_reminders
"""
import logging
from datetime import date, timedelta

from django.utils import timezone

from academics.models import StudentCourse
from bookings.models import PDLBooking
from services.sms_service import send_sms
from sms.models import SMSLog

logger = logging.getLogger(__name__)


def _log(phone, message, result):
    SMSLog.objects.create(
        phone=phone,
        message=message,
        status="sent" if result["success"] else "failed",
        response=result,
    )


# send_weekly_balance_reminders and send_pdl_expiry_reminders are disabled
