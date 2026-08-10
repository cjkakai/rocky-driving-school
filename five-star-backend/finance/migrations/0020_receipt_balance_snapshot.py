from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0019_add_branch_to_payment_transaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="paymenttransaction",
            name="receipt_previous_balance",
            field=models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="paymenttransaction",
            name="receipt_new_balance",
            field=models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True),
        ),
    ]
