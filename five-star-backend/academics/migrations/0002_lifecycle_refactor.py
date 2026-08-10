from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0001_initial'),
    ]

    operations = [
        # Add is_refresher_course to Course
        migrations.AddField(
            model_name='course',
            name='is_refresher_course',
            field=models.BooleanField(default=False),
        ),
        # Expand StudentCourse status field length and choices
        migrations.AlterField(
            model_name='studentcourse',
            name='status',
            field=models.CharField(
                choices=[
                    ('onboarded',            'Onboarded'),
                    ('pending_pdl',          'Pending PDL'),
                    ('active',               'Active'),
                    ('pending_exam_booking', 'Pending Exam Booking'),
                    ('exam_booked',          'Exam Booked'),
                    ('exam_approved',        'Exam Approved'),
                    ('failed',               'Failed'),
                    ('retake_booked',        'Retake Booked'),
                    ('completed',            'Completed'),
                    ('dormant',              'Dormant'),
                ],
                default='onboarded',
                max_length=30,
                db_index=True,
            ),
        ),
        # Add exam_attempt_count
        migrations.AddField(
            model_name='studentcourse',
            name='exam_attempt_count',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # Add last_exam_result
        migrations.AddField(
            model_name='studentcourse',
            name='last_exam_result',
            field=models.CharField(blank=True, default='', max_length=10),
        ),
        # Remove unique_together to allow refresher re-enrollment
        migrations.AlterUniqueTogether(
            name='studentcourse',
            unique_together=set(),
        ),
    ]
