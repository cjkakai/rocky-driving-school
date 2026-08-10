from django.urls import path
from .views import (
    summary_stats,
    activity_feed,
    branch_performance,
    revenue_trend,
    daily_revenue_trend,
)

urlpatterns = [
    path('dashboard/summary-stats/', summary_stats, name='dashboard-summary-stats'),
    path('dashboard/activity-feed/', activity_feed, name='dashboard-activity-feed'),
    path('dashboard/branch-performance/', branch_performance, name='dashboard-branch-performance'),
    path('dashboard/revenue-trend/', revenue_trend, name='dashboard-revenue-trend'),
    path('dashboard/daily-revenue-trend/', daily_revenue_trend, name='dashboard-daily-revenue-trend'),
]
