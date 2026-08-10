from django.contrib import admin
from .models import (
    PaymentTransaction,
    MpesaSTKRequest,
    PaymentValidation,
    PaymentConfirmation,
    BankNotification,
)


class ReadOnlyAdmin(admin.ModelAdmin):
    """Base admin — all fields readonly, adding disabled."""

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(ReadOnlyAdmin):
    list_display = [
        "reference_code", "student", "amount", "payment_type",
        "status", "payment_method", "receipt_print_count", "created_at",
    ]
    list_filter = ["status", "payment_type", "payment_method"]
    search_fields = ["reference_code", "student__name", "description"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(MpesaSTKRequest)
class MpesaSTKRequestAdmin(ReadOnlyAdmin):
    list_display = [
        "checkout_request_id", "phone_number", "amount",
        "account_reference", "status", "mpesa_receipt", "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["checkout_request_id", "phone_number", "account_reference", "mpesa_receipt"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(PaymentValidation)
class PaymentValidationAdmin(ReadOnlyAdmin):
    list_display = [
        "transaction_reference_code", "institution_code",
        "service_name", "message_id", "created_at",
    ]
    search_fields = ["transaction_reference_code", "message_id", "institution_code"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(PaymentConfirmation)
class PaymentConfirmationAdmin(ReadOnlyAdmin):
    list_display = [
        "payment_reference_code", "account_number", "account_name",
        "payment_amount", "currency", "institution_name",
        "payment_transaction", "created_at",
    ]
    list_filter = ["currency", "payment_mode"]
    search_fields = [
        "payment_reference_code", "account_number",
        "account_name", "document_reference_number", "message_id",
    ]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(BankNotification)
class BankNotificationAdmin(ReadOnlyAdmin):
    list_display = [
        "transaction_id", "account_number", "amount",
        "event_type", "payment_ref", "payment_transaction", "created_at",
    ]
    list_filter = ["event_type", "currency"]
    search_fields = ["transaction_id", "account_number", "payment_ref", "narration"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"