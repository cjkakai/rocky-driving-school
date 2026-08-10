# Generated migration

from django.db import migrations, models


def generate_receipt_numbers(apps, schema_editor):
    PaymentTransaction = apps.get_model('finance', 'PaymentTransaction')
    transactions = PaymentTransaction.objects.filter(receipt_number__isnull=True).order_by('id')
    
    for idx, tx in enumerate(transactions, start=1):
        tx.receipt_number = f"RCP{str(idx).zfill(6)}"
        tx.save(update_fields=['receipt_number'])


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0017_channel_payment_transaction'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='receipt_number',
            field=models.CharField(blank=True, max_length=30, null=True, unique=True),
        ),
        migrations.RunPython(generate_receipt_numbers, migrations.RunPython.noop),
    ]
