from django.urls import path
from . import views

urlpatterns = [
    # CRUD
    path("targets/revenue/",              views.revenue_target_list_create,   name="revenue-targets"),
    path("targets/registrations/",        views.registration_target_list_create, name="registration-targets"),
    # KPIs
    path("targets/revenue/kpi/",          views.revenue_kpi,                  name="revenue-kpi"),
    path("targets/registrations/kpi/",    views.registration_kpi,             name="registration-kpi"),
    # Branch breakdowns
    path("targets/revenue/branches/",     views.revenue_branches,             name="revenue-branches"),
    path("targets/registrations/branches/", views.registration_branches,      name="registration-branches"),
    # Trends
    path("targets/revenue/trend/",        views.revenue_trend,                name="revenue-trend"),
    path("targets/registrations/trend/",  views.registration_trend,           name="registration-trend"),
    # Summary + export
    path("targets/summary/",              views.summary,                      name="targets-summary"),
    path("targets/export/",               views.export_summary,               name="targets-export"),
    # Server-side current period
    path("targets/current-period/",       views.current_period,               name="targets-current-period"),
]
