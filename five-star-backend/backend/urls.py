from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("students.urls")),
    path("api/", include("branches.urls")),
    path("api/", include("academics.urls")),
    path("api/", include("bookings.urls")),
    path("api/", include("finance.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("sms.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("expenses.urls")),
    path("api/", include("vehicles.urls")),
    path("api/", include("targets.urls")),
]
