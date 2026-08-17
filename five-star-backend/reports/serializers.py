from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id", "branch", "branch_name", "created_by", "created_by_name",
            "report_date", "inquiries", "notes", "created_at",
        ]
        read_only_fields = [
            "id", "branch", "created_by", "branch_name", "created_by_name", "created_at",
        ]