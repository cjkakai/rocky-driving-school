from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="pdlbooking",
            name="pdl_reminder_sent",
            field=models.BooleanField(default=False),
        ),
    ]
