from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ["registration_number", "vehicle_name", "vehicle_type", "insurance_status", "inspection_status"]
    list_filter = ["insurance_status", "inspection_status", "vehicle_type"]
    search_fields = ["registration_number", "vehicle_name"]
    ordering = ["registration_number"]
