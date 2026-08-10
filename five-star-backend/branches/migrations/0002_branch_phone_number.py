from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("branches", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="branch",
            name="phone_number",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
