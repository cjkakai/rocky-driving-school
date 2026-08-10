from rest_framework import serializers
from .models import RevenueTarget, RegistrationTarget


class RevenueTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = RevenueTarget
        fields = ["id", "branch", "year", "week", "target_amount", "created_at"]
        read_only_fields = ["id", "created_at"]
        validators = []

    def validate_week(self, value):
        if not (1 <= value <= 53):
            raise serializers.ValidationError("Week must be between 1 and 53.")
        return value

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Target amount must be greater than zero.")
        return value


class RegistrationTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationTarget
        fields = ["id", "branch", "year", "month", "target_count", "created_at"]
        read_only_fields = ["id", "created_at"]
        validators = []

    def validate_month(self, value):
        if not (1 <= value <= 12):
            raise serializers.ValidationError("Month must be between 1 and 12.")
        return value

    def validate_target_count(self, value):
        if value <= 0:
            raise serializers.ValidationError("Target count must be greater than zero.")
        return value
