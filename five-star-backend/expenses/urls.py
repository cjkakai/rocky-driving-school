from django.urls import path
from . import views

urlpatterns = [
    # Categories — must come before <int:pk> catch-all
    path("expenses/categories/", views.category_list_create),
    path("expenses/categories/<int:pk>/", views.category_detail),

    # Analytics — must come before <int:pk> catch-all
    path("expenses/analytics/profitability-kpi/", views.analytics_profitability_kpi),
    path("expenses/analytics/branch-profitability/", views.analytics_branch_profitability),
    path("expenses/analytics/general-expenses/", views.analytics_general_expenses),
    path("expenses/analytics/revenue-time-series/", views.analytics_revenue_time_series),

    # Excel exports — before <int:pk> catch-all
    path("expenses/export/profitability/", views.export_profitability),
    path("expenses/export/expenses/", views.export_expenses),

    # Expense CRUD
    path("expenses/", views.expense_list_create),
    path("expenses/<int:pk>/", views.expense_detail),
]
