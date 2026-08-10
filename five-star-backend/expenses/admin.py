from django.contrib import admin
from .models import Expense, ExpenseCategory


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ["expense_date", "expense_type", "branch", "category", "amount", "created_by"]
    list_filter = ["expense_type", "category", "branch"]
    search_fields = ["description"]
    date_hierarchy = "expense_date"
    ordering = ["-expense_date"]
