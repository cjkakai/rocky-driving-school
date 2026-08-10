from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0008_paymenttransaction_receipt_print_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymenttransaction",
            name="payment_type",
            field=models.CharField(
                max_length=20,
                choices=[("REGISTRATION", "Registration"), ("TOP_UP", "Top-Up")],
                default="TOP_UP",
            ),
        ),
        migrations.AddIndex(
            model_name="paymenttransaction",
            index=models.Index(fields=["payment_type"], name="finance_payment_type_idx"),
        ),
    ]
