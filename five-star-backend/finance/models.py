from django.db import models
from django.conf import settings
from django.utils.dateparse import parse_datetime, parse_date


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("orphaned", "Orphaned")
    ]

    PAYMENT_TYPE_CHOICES = [
        ("REGISTRATION", "Registration"),
        ("TOP_UP", "Top-Up"),
        ("RETAKE", "Retake"),
        ("PDL_REACTIVATION", "PDL Reactivation"),
        ("UNALLOCATED", "Unallocated"),
        ("CREDIT_TRANSFER", "Credit Transfer"),
    ]

    PAYMENT_METHODS = [
        ("bank", "Bank"),
        ("coop_stk", "Co-op STK"),
        ("bank_ipn", "Bank Transfer (IPN)"),
        ("bank_b2b", "Bank (B2B)"),
    ]

    student_course = models.ForeignKey(
        "academics.StudentCourse", on_delete=models.CASCADE, related_name="payments",
        null=True, blank=True
    )
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="payments",
        null=True, blank=True
    )
    branch = models.ForeignKey(
        "branches.Branch", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orphaned_payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    reference_code = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="bank")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    data = models.TextField()

    payment_type = models.CharField(
        max_length=20, choices=PAYMENT_TYPE_CHOICES, default="TOP_UP"
    )

    # Receipt print tracking
    receipt_print_count = models.PositiveSmallIntegerField(default=0)
    first_printed_at = models.DateTimeField(null=True, blank=True)
    printed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="printed_receipts"
    )
    mpesa_reference = models.CharField(max_length=50, null=True, blank=True)
    channel = models.CharField(max_length=50, null=True, blank=True)
    receipt_number = models.CharField(max_length=30, unique=True, blank=True, null=True)

    # Immutable receipt snapshot — captured once at payment creation time
    receipt_previous_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    receipt_new_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.reference_code} - {self.student_course}"

    class Meta:
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["student_course", "status"]),
            models.Index(fields=["branch", "status"]),
        ]



class MpesaSTKRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
        ("timeout", "Timeout"),
    ]

    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    result_code = models.CharField(max_length=10, blank=True)
    result_desc = models.CharField(max_length=255, blank=True)
    mpesa_receipt = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.checkout_request_id} — {self.status}"

    class Meta:
        indexes = [
            models.Index(fields=["checkout_request_id"], name="finance_mpesa_checkout_idx"),
            models.Index(fields=["account_reference"], name="finance_mpesa_acctref_idx"),
        ]


class PaymentValidation(models.Model):
    """Records incoming Co-op payment validation requests."""

    # Header
    connection_id = models.CharField(max_length=100, blank=True)
    message_id = models.CharField(max_length=100, blank=True)
    service_name = models.CharField(max_length=255, blank=True)

    # Request
    transaction_reference_code = models.CharField(max_length=100, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    institution_code = models.CharField(max_length=100, blank=True)

    # Full payload
    raw_payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["transaction_reference_code"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Validation [{self.transaction_reference_code}] — {self.created_at}"

    @classmethod
    def record(cls, payload: dict):
        """Safe recording — never raises, returns the instance or None."""
        try:
            header = payload.get("header", {})
            req = payload.get("request", {})
            return cls.objects.create(
                connection_id=header.get("connectionID", ""),
                message_id=header.get("messageID", ""),
                service_name=header.get("serviceName", ""),
                transaction_reference_code=req.get("TransactionReferenceCode", ""),
                transaction_date=parse_datetime(req.get("TransactionDate", "") or ""),
                institution_code=str(req.get("InstitutionCode", "")),
                raw_payload=payload,
            )
        except Exception:
            return None


class PaymentConfirmation(models.Model):
    """Records incoming Co-op payment confirmation requests."""

    # Header
    connection_id = models.CharField(max_length=100, blank=True)
    message_id = models.CharField(max_length=100, blank=True)
    service_name = models.CharField(max_length=255, blank=True)

    # Request — key queryable fields
    transaction_reference_code = models.CharField(max_length=100, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="KES")
    document_reference_number = models.CharField(max_length=100, blank=True)
    payment_reference_code = models.CharField(max_length=100, blank=True)
    payment_code = models.CharField(max_length=50, blank=True)
    payment_mode = models.CharField(max_length=50, blank=True)
    bank_code = models.CharField(max_length=50, blank=True)
    branch_code = models.CharField(max_length=50, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    account_name = models.CharField(max_length=255, blank=True)
    additional_info = models.TextField(blank=True)
    institution_code = models.CharField(max_length=100, blank=True)
    institution_name = models.CharField(max_length=255, blank=True)

    # Link to the resulting PaymentTransaction once matched
    payment_transaction = models.ForeignKey(
        "finance.PaymentTransaction",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="confirmations",
    )

    raw_payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["account_number"]),
            models.Index(fields=["transaction_reference_code"]),
            models.Index(fields=["payment_reference_code"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Confirmation [{self.payment_reference_code}] {self.payment_amount} — {self.created_at}"

    @classmethod
    def record(cls, payload: dict):
        header = payload.get("header", {})
        req = payload.get("request", {})

        def _decimal(val):
            try:
                return float(val) if val not in (None, "") else None
            except (ValueError, TypeError):
                return None

        return cls.objects.create(
            connection_id=header.get("connectionID", ""),
            message_id=header.get("messageID", ""),
            service_name=header.get("serviceName", ""),
            transaction_reference_code=req.get("TransactionReferenceCode", ""),
            transaction_date=parse_datetime(req.get("TransactionDate", "") or ""),
            payment_date=parse_datetime(req.get("PaymentDate", "") or ""),
            total_amount=_decimal(req.get("TotalAmount")),
            payment_amount=_decimal(req.get("PaymentAmount")),
            currency=req.get("Currency", "KES"),
            document_reference_number=req.get("DocumentReferenceNumber", ""),
            payment_reference_code=req.get("PaymentReferenceCode", ""),
            payment_code=str(req.get("PaymentCode", "")),
            payment_mode=str(req.get("PaymentMode", "")),
            bank_code=req.get("BankCode", ""),
            branch_code=req.get("BranchCode", ""),
            account_number=str(req.get("AccountNumber", "")),
            account_name=req.get("AccountName", ""),
            additional_info=req.get("AdditionalInfo", ""),
            institution_code=str(req.get("InstitutionCode", "")),
            institution_name=req.get("InstitutionName", ""),
            raw_payload=payload,
        )


class BankNotification(models.Model):
    """Records incoming bank credit notification webhooks."""

    account_number = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    booked_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cleared_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="KES")
    cust_memo_line1 = models.CharField(max_length=255, blank=True)
    cust_memo_line2 = models.CharField(max_length=255, blank=True)
    cust_memo_line3 = models.CharField(max_length=255, blank=True)
    event_type = models.CharField(max_length=50, blank=True)
    exchange_rate = models.CharField(max_length=50, blank=True)
    narration = models.TextField(blank=True)
    payment_ref = models.CharField(max_length=100, blank=True)
    posting_date = models.DateField(null=True, blank=True)
    value_date = models.DateField(null=True, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)

    # Link to the resulting PaymentTransaction once matched
    payment_transaction = models.ForeignKey(
        "finance.PaymentTransaction",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="bank_notifications",
    )

    raw_payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["account_number"]),
            models.Index(fields=["transaction_id"]),
            models.Index(fields=["payment_ref"]),
            models.Index(fields=["event_type", "created_at"]),
        ]

    def __str__(self):
        return f"BankNotif [{self.transaction_id}] {self.event_type} {self.amount} — {self.created_at}"

    @classmethod
    def record(cls, payload: dict):
        def _decimal(val):
            try:
                return float(val) if val not in (None, "") else None
            except (ValueError, TypeError):
                return None

        return cls.objects.create(
            account_number=payload.get("AcctNo", ""),
            amount=_decimal(payload.get("Amount")),
            booked_balance=_decimal(payload.get("BookedBalance")),
            cleared_balance=_decimal(payload.get("ClearedBalance")),
            currency=payload.get("Currency", "KES"),
            cust_memo_line1=payload.get("CustMemoLine1", ""),
            cust_memo_line2=payload.get("CustMemoLine2", ""),
            cust_memo_line3=payload.get("CustMemoLine3", ""),
            event_type=payload.get("EventType", ""),
            exchange_rate=payload.get("ExchangeRate", ""),
            narration=payload.get("Narration", ""),
            payment_ref=payload.get("PaymentRef", ""),
            posting_date=parse_date(payload.get("PostingDate", "") or ""),
            value_date=parse_date(payload.get("ValueDate", "") or ""),
            transaction_date=parse_datetime(payload.get("TransactionDate", "") or ""),
            transaction_id=payload.get("TransactionId", ""),
            raw_payload=payload,
        )

