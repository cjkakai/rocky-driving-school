from django.db import migrations, models


def normalize_student_statuses(apps, schema_editor):
    """
    Migrate existing student statuses:
    - 'pending' → 'active' (newly registered students are active by default)
    - others remain as-is (active, dormant, offloaded are all valid)
    """
    Student = apps.get_model('students', 'Student')
    Student.objects.filter(status='pending').update(status='active')


def normalize_student_course_statuses(apps, schema_editor):
    """
    Migrate existing StudentCourse statuses to new lifecycle:
    - 'pending' → 'onboarded'
    - 'passed'  → 'completed'
    - 'active'  → 'active' (stays, but may need pending_exam_booking — left as active for safety)
    - 'failed'  → 'failed' (stays)
    - 'dormant' → 'dormant' (stays)
    """
    StudentCourse = apps.get_model('academics', 'StudentCourse')
    StudentCourse.objects.filter(status='pending').update(status='onboarded')
    StudentCourse.objects.filter(status='passed').update(status='completed')


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0001_initial'),
        ('academics', '0002_lifecycle_refactor'),
    ]

    operations = [
        # Normalize StudentCourse statuses first (depends on academics migration)
        migrations.RunPython(normalize_student_course_statuses, migrations.RunPython.noop),
        # Update Student status choices
        migrations.AlterField(
            model_name='student',
            name='status',
            field=models.CharField(
                choices=[
                    ('active',    'Active'),
                    ('dormant',   'Dormant'),
                    ('offloaded', 'Offloaded'),
                ],
                default='active',
                db_index=True,
                max_length=20,
            ),
        ),
        # Normalize student statuses
        migrations.RunPython(normalize_student_statuses, migrations.RunPython.noop),
    ]
