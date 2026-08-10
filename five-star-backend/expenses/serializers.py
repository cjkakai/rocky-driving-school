from rest_framework import serializers
from .models import Expense, ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ExpenseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id", "branch", "branch_name", "expense_type",
            "category", "category_name",
            "description", "amount", "expense_date", "created_at",
            "created_by", "created_by_name",
        ]
        read_only_fields = ["id", "created_at", "created_by", "branch_name", "created_by_name", "category_name"]

    def validate(self, data):
        expense_type = data.get("expense_type", "GENERAL")
        branch = data.get("branch")
        if expense_type == "BRANCH" and not branch:
            raise serializers.ValidationError({"branch": "Branch is required for BRANCH type expenses."})
        if expense_type == "GENERAL":
            data["branch"] = None
        return data
