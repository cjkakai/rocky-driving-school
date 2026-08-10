from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "id", "registration_number", "vehicle_name", "vehicle_type",
            "insurance_status", "insurance_expiry_date",
            "inspection_status", "inspection_due_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
