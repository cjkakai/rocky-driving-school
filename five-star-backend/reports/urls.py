from django.urls import path
from . import views

urlpatterns = [
    # Core CRUD
    path("reports/", views.reports_list_create),
    path("reports/daily/", views.daily_summary),
    path("reports/preview/", views.report_preview),
    path("reports/courses/", views.courses_list),
    path("reports/branches/", views.branches_list_for_reports),
    path("reports/<int:pk>/", views.report_detail),
    path("reports/<int:pk>/drilldown/", views.report_drilldown),
    path("reports/<int:pk>/trips/", views.report_trips),

    # Analytics
    path("reports/analytics/kpi-summary/", views.analytics_kpi_live),
    path("reports/analytics/branch-comparison/", views.analytics_branch_comparison),
    path("reports/analytics/time-series/", views.analytics_time_series),
    path("reports/analytics/payment-type-breakdown/", views.analytics_payment_types),
    path("reports/analytics/export-summary/", views.analytics_export_summary),

    # Excel export
    path("reports/export/excel/", views.export_reports_excel),
]
