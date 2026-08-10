import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

logger = logging.getLogger("payments")


@receiver(pre_save, sender="finance.PaymentTransaction")
def track_completion_transition(sender, instance, **kwargs):
    if not instance.pk:
        # New record — transition only if being created as completed
        instance._becoming_completed = instance.status == "completed"
    else:
        try:
            old_status = sender.objects.only("status").get(pk=instance.pk).status
            instance._becoming_completed = old_status != "completed" and instance.status == "completed"
        except sender.DoesNotExist:
            instance._becoming_completed = False


@receiver(pre_save, sender="finance.PaymentTransaction")
def generate_receipt_number(sender, instance, **kwargs):
    # Generate for any new transaction regardless of status (completed or orphaned)
    if instance.receipt_number:
        return
    # Only assign on creation (no pk yet) or if somehow missed
    from finance.models import PaymentTransaction
    last_receipt = PaymentTransaction.objects.filter(
        receipt_number__startswith='RCP'
    ).order_by('-receipt_number').first()

    if last_receipt:
        try:
            last_num = int(last_receipt.receipt_number.replace('RCP', ''))
            next_num = last_num + 1
        except (ValueError, AttributeError):
            next_num = PaymentTransaction.objects.count() + 1
    else:
        next_num = 1

    instance.receipt_number = f"RCP{str(next_num).zfill(6)}"


@receiver(post_save, sender="finance.PaymentTransaction")
def payment_transaction_post_save(sender, instance, created, **kwargs):
    if instance.status != "completed" or not instance.student_course_id:
        return

    from students.lifecycle import on_payment_completed
    try:
        sc = instance.student_course
        sc.refresh_from_db()
        on_payment_completed(sc)
    except Exception:
        pass  # never break payment recording due to lifecycle errors

    if getattr(instance, "_becoming_completed", False):
        _send_payment_sms(instance)


def _send_payment_sms(tx):
    try:
        from services.sms_service import send_sms
        from sms.models import SMSLog
        from .views import _contact_footer

        student = tx.student
        sc = tx.student_course
        if not student or not sc:
            return

        agreed = sc.amount_agreed or 0
        paid = sum(p.amount for p in sc.payments.filter(status="completed"))
        balance = max(agreed - paid, 0)
        course_name = sc.course.class_name if sc.course else "Driving Course"

        sms_msg = (
            f"Dear {student.full_name},\n\n"
            f"Payment received successfully.\n\n"
            f"Ref: {tx.reference_code}\n"
            f"Course: {course_name}\n"
            f"Paid: KES {tx.amount}\n"
            f"Balance: KES {balance}\n\n"
            f"No cash payments accepted.\n"
            f"Always insist on a computer-generated receipt.\n\n"
            f"All payments made are non-refundable and non-transferable.\n\n"
            f"{_contact_footer(student.branch)}"
        )

        result = send_sms(student.phone, sms_msg)
        SMSLog.objects.create(
            phone=student.phone,
            message=sms_msg,
            status="sent" if result.get("success") else "failed",
            response=result,
        )
        logger.info(f"Payment SMS sent to {student.phone} for {tx.reference_code}")
    except Exception as e:
        logger.error(f"Payment SMS failed for tx {tx.id}: {e}")
