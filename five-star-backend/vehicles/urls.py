from django.urls import path
from . import views

urlpatterns = [
    path("vehicles/", views.vehicle_list_create),
    path("vehicles/stats/", views.vehicle_stats),
    path("vehicles/for-report/", views.vehicles_for_report),
    path("vehicles/analytics/trips/", views.trip_analytics),
    path("vehicles/<int:pk>/", views.vehicle_detail),
]
