from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)

    class Meta:
        model = Vehicle
        fields = [
            "id", "registration_number", "vehicle_name", "vehicle_type",
            "insurance_status", "insurance_expiry_date",
            "inspection_status", "inspection_due_date",
            "branch", "branch_name", "created_at",
        ]
        read_only_fields = ["id", "created_at", "branch_name"]
