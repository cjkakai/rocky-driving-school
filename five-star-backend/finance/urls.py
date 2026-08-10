from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentTransactionViewSet, payment_validation, payment_confirmation,
    bank_payment_notification, search_student_course, allocate_payment,
    coop_stk_push, coop_stk_status, coop_stk_callback,
    record_print, export_payments, payments_summary,
)

router = DefaultRouter()
router.register(r"payments", PaymentTransactionViewSet, basename="payments")


urlpatterns = [
    path("payments/coop/stk-push/", coop_stk_push, name="coop-stk-push"),
    path("payments/coop/status/<str:checkout_request_id>/", coop_stk_status, name="coop-stk-status"),
    path("payments/coop/callback/", coop_stk_callback, name="coop-stk-callback"),
    path("payments/validate/", payment_validation, name="payment-validation"),
    path("payments/confirm/", payment_confirmation, name="payment-confirmation"),
    path("payments/notification/", bank_payment_notification, name="payment-notification"),
    path("payments/search-student-course/", search_student_course, name="search-student-course"),
    path("payments/<int:pk>/allocate/", allocate_payment, name="allocate-payment"),
    path("payments/<int:pk>/record-print/", record_print, name="record-print"),
    path("payments/export/", export_payments, name="export-payments"),
    path("payments/summary/", payments_summary, name="payments-summary"),
    path("", include(router.urls)),
]
