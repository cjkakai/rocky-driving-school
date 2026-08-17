from django.db import migrations, models
import re


def lessons_char_to_int(apps, schema_editor):
    Course = apps.get_model("academics", "Course")
    for course in Course.objects.all():
        val = course.lessons or ""
        match = re.search(r"\d+", str(val))
        course.lessons = int(match.group()) if match else 0
        course.save(update_fields=["lessons"])


def exam_booked_to_exam_list(apps, schema_editor):
    StudentCourse = apps.get_model("academics", "StudentCourse")
    StudentCourse.objects.filter(status="exam_booked").update(status="exam_list")


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0008_instructor_model"),
    ]

    operations = [
        # 1. Run data migration before altering the field
        migrations.RunPython(lessons_char_to_int, migrations.RunPython.noop),

        # 2. Alter lessons field from CharField to PositiveSmallIntegerField
        migrations.AlterField(
            model_name="course",
            name="lessons",
            field=models.PositiveSmallIntegerField(default=0),
        ),

        # 3. Rename exam_booked → exam_list in existing rows
        migrations.RunPython(exam_booked_to_exam_list, migrations.RunPython.noop),

        # 4. Update STATUS_CHOICES on StudentCourse
        migrations.AlterField(
            model_name="studentcourse",
            name="status",
            field=models.CharField(
                choices=[
                    ("onboarded",            "Onboarded"),
                    ("pending_pdl",          "Pending PDL"),
                    ("active",               "Active"),
                    ("pending_exam_booking", "Pending Exam"),
                    ("exam_list",            "Exam List"),
                    ("exam_approved",        "Exam Approved"),
                    ("failed",               "Failed"),
                    ("retake_booked",        "Retake Booked"),
                    ("completed",            "Completed"),
                    ("dormant",              "Dormant"),
                    ("transferred",          "Transferred"),
                ],
                db_index=True,
                default="onboarded",
                max_length=30,
            ),
        ),
    ]
