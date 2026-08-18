from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('branches', '0001_initial'),
        ('vehicles', '0002_remove_vehicle_vehicles_ve_branch__ba2eae_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='branch',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='vehicles',
                to='branches.branch',
            ),
        ),
    ]
