from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0006_course_is_active_for_registration"),
        ("branches", "0001_initial"),
        ("students", "0003_alter_student_created_at"),
        ("vehicles", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Lesson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField()),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("duration_minutes", models.PositiveSmallIntegerField(default=0)),
                ("lesson_type", models.CharField(default="practical", max_length=50)),
                ("status", models.CharField(
                    choices=[
                        ("completed", "Completed"),
                        ("scheduled", "Scheduled"),
                        ("cancelled", "Cancelled"),
                        ("no_show", "No Show"),
                    ],
                    default="completed",
                    max_length=20,
                )),
                ("notes", models.TextField(blank=True)),
                ("instructor_remarks", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("student_course", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="lessons",
                    to="academics.studentcourse",
                )),
                ("student", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="lessons",
                    to="students.student",
                )),
                ("branch", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to="branches.branch",
                )),
                ("instructor", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="lessons_taught",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("vehicle", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to="vehicles.vehicle",
                )),
                ("created_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="lessons_created",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "ordering": ["-date", "-start_time"],
                "indexes": [
                    models.Index(fields=["student", "date"], name="academics_lesson_student_date_idx"),
                    models.Index(fields=["student_course", "status"], name="academics_lesson_sc_status_idx"),
                ],
            },
        ),
    ]
