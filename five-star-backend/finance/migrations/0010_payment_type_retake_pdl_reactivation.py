from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0009_paymenttransaction_payment_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="paymenttransaction",
            name="payment_type",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("REGISTRATION", "Registration"),
                    ("TOP_UP", "Top-Up"),
                    ("RETAKE", "Retake"),
                    ("PDL_REACTIVATION", "PDL Reactivation"),
                ],
                default="TOP_UP",
            ),
        ),
    ]
