from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "role", "branch"]
    list_filter = ["role", "branch"]
    fieldsets = UserAdmin.fieldsets + (
        ("Role & Branch", {"fields": ("role", "branch")}),
    )
