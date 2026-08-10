from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0002_lifecycle_refactor"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="studentcourse",
            name="status",
            field=models.CharField(
                choices=[
                    ("onboarded", "Onboarded"),
                    ("pending_pdl", "Pending PDL"),
                    ("active", "Active"),
                    ("pending_exam_booking", "Pending Exam Booking"),
                    ("exam_booked", "Exam Booked"),
                    ("exam_approved", "Exam Approved"),
                    ("failed", "Failed"),
                    ("retake_booked", "Retake Booked"),
                    ("completed", "Completed"),
                    ("dormant", "Dormant"),
                    ("transferred", "Transferred"),
                ],
                db_index=True,
                default="onboarded",
                max_length=30,
            ),
        ),
        migrations.CreateModel(
            name="CourseTransfer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("credit_amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("reason", models.TextField(blank=True)),
                ("transferred_at", models.DateTimeField(auto_now_add=True)),
                (
                    "old_student_course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="transfers_out",
                        to="academics.studentcourse",
                    ),
                ),
                (
                    "new_student_course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="transfers_in",
                        to="academics.studentcourse",
                    ),
                ),
                (
                    "transferred_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
