from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0010_lesson_type_choices"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="practical_lessons",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="course",
            name="theory_lessons",
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]
