from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0005_fix_registration_date_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="is_active_for_registration",
            field=models.BooleanField(default=True, db_index=True),
        ),
    ]
