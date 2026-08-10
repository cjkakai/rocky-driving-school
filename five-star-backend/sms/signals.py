from django.db.models.signals import post_save
from django.dispatch import receiver
from academics.models import StudentCourse
from services.sms_service import send_sms
from sms.models import SMSLog


def _contact_footer(branch):
    lines = []
    if branch:
        branch_line = f"{branch.name} Branch"
        if branch.phone_number:
            branch_line += f": {branch.phone_number}"
        lines.append(branch_line)
    lines.append("HQ: +254 727 555 558")
    return "\n".join(lines)


@receiver(post_save, sender=StudentCourse)
def on_student_course_created(sender, instance, created, **kwargs):
    if not created:
        return

    student = instance.student
    course = instance.course
    branch = student.branch

    balance = instance.amount_agreed or 0

    message = (
        f"Dear {student.full_name},\n\n"
        f"Welcome to Five Star Driving School.\n\n"
        f"Kindly pay via:\n"
        f"Paybill: 400222\n"
        f"Acc: 1177070#{instance.payment_reference}\n\n"
        f"Course: {course.class_name}\n"
        f"Fees: KES {balance}\n\n"
        f"WE DON'T ACCEPT CASH PAYMENTS.\n\n"
        f"{_contact_footer(branch)}"
    )

    result = send_sms(student.phone, message)

    SMSLog.objects.create(
        phone=student.phone,
        message=message,
        status="sent" if result.get("success") else "failed",
        response=result,
    )
