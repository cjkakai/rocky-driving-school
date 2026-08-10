from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0006_payment_transaction_indexes"),
    ]

    operations = [
        migrations.CreateModel(
            name="MpesaSTKRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("checkout_request_id", models.CharField(max_length=100, unique=True)),
                ("merchant_request_id", models.CharField(max_length=100, blank=True)),
                ("phone_number", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("account_reference", models.CharField(max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("success", "Success"),
                            ("failed", "Failed"),
                            ("cancelled", "Cancelled"),
                            ("timeout", "Timeout"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("result_code", models.CharField(blank=True, max_length=10)),
                ("result_desc", models.CharField(blank=True, max_length=255)),
                ("mpesa_receipt", models.CharField(blank=True, max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["checkout_request_id"], name="finance_mpesa_checkout_idx"),
                    models.Index(fields=["account_reference"], name="finance_mpesa_acctref_idx"),
                ],
            },
        ),
    ]
