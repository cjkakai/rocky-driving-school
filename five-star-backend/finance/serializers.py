import json
from rest_framework import serializers
from academics.models import StudentCourse
from .models import PaymentTransaction, MpesaSTKRequest


def _safe_json(value):
    try:
        return json.loads(value) if value else None
    except (ValueError, TypeError):
        return value


class StudentCourseSearchSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    course_name = serializers.CharField(source="course.class_name", read_only=True)

    class Meta:
        model = StudentCourse
        fields = ["id", "payment_reference", "student_name", "course_name"]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    payment_reference = serializers.CharField(source="reference_code", read_only=True)
    branch_name = serializers.SerializerMethodField()
    branch_phone_number = serializers.SerializerMethodField()

    def _branch(self, obj):
        return obj.branch or (obj.student.branch if obj.student_id else None)

    def get_branch_name(self, obj):
        b = self._branch(obj)
        return b.name if b else None

    def get_branch_phone_number(self, obj):
        b = self._branch(obj)
        return b.phone_number if b else None
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_admission = serializers.CharField(source="student.admission_number", read_only=True)
    course_name = serializers.CharField(source="student_course.course.class_name", read_only=True)
    student_course_reference = serializers.CharField(source="student_course.payment_reference", read_only=True)
    balance = serializers.SerializerMethodField()
    previous_balance = serializers.SerializerMethodField()
    payment_amount = serializers.DecimalField(source="amount", max_digits=10, decimal_places=2, read_only=True)
    new_balance = serializers.SerializerMethodField()

    def _get_agreed_and_payments(self, obj):
        sc = obj.student_course
        if not sc:
            return None, None
        agreed = sc.amount_agreed or 0
        all_payments = sorted(sc.payments.all(), key=lambda p: p.created_at)
        return agreed, all_payments

    def get_balance(self, obj):
        agreed, all_payments = self._get_agreed_and_payments(obj)
        if agreed is None:
            return None
        total_paid = sum(p.amount for p in all_payments)
        return agreed - total_paid

    def get_previous_balance(self, obj):
        # Use immutable snapshot if available (all new transactions)
        if obj.receipt_previous_balance is not None:
            return obj.receipt_previous_balance
        # Fallback: dynamic calculation for legacy transactions
        agreed, all_payments = self._get_agreed_and_payments(obj)
        if agreed is None:
            return None
        paid_before = sum(p.amount for p in all_payments if p.id != obj.id)
        return agreed - paid_before

    def get_new_balance(self, obj):
        # Use immutable snapshot if available (all new transactions)
        if obj.receipt_new_balance is not None:
            return obj.receipt_new_balance
        # Fallback: dynamic calculation for legacy transactions
        agreed, all_payments = self._get_agreed_and_payments(obj)
        if agreed is None:
            return None
        total_paid = sum(p.amount for p in all_payments)
        return agreed - total_paid

    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "student_course", "student", "amount",
            "status", "payment_type", "reference_code", "payment_reference", "payment_method",
            "mpesa_reference", "channel",
            "description", "created_at", "updated_at",
            "branch_name", "branch_phone_number", "student_name", "student_admission",
            "course_name", "student_course_reference", "balance",
            "previous_balance", "payment_amount", "new_balance",
            "receipt_print_count", "first_printed_at", "printed_by",
            "receipt_number", "transaction_date",
        ]
        read_only_fields = ["student"]
        extra_kwargs = {
            "student_course": {"required": True},
        }


class PaymentTransactionDetailSerializer(PaymentTransactionSerializer):
    source_detail = serializers.SerializerMethodField()

    def get_source_detail(self, obj):
        n = obj.bank_notifications.first()
        if n:
            return {
                "source": "bank_ipn",
                "transaction_id": n.transaction_id,
                "account_number": n.account_number,
                "amount": str(n.amount) if n.amount is not None else None,
                "currency": n.currency,
                "narration": n.narration,
                "payment_ref": n.payment_ref,
                "event_type": n.event_type,
                "posting_date": str(n.posting_date) if n.posting_date else None,
                "value_date": str(n.value_date) if n.value_date else None,
                "transaction_date": str(n.transaction_date) if n.transaction_date else None,
                "booked_balance": str(n.booked_balance) if n.booked_balance is not None else None,
                "cleared_balance": str(n.cleared_balance) if n.cleared_balance is not None else None,
                "exchange_rate": n.exchange_rate,
                "cust_memo_line1": n.cust_memo_line1,
                "cust_memo_line2": n.cust_memo_line2,
                "cust_memo_line3": n.cust_memo_line3,
            }
        c = obj.confirmations.first()
        if c:
            return {
                "source": "bank_b2b",
                "transaction_reference_code": c.transaction_reference_code,
                "payment_reference_code": c.payment_reference_code,
                "document_reference_number": c.document_reference_number,
                "account_number": c.account_number,
                "account_name": c.account_name,
                "payment_amount": str(c.payment_amount) if c.payment_amount is not None else None,
                "total_amount": str(c.total_amount) if c.total_amount is not None else None,
                "currency": c.currency,
                "payment_mode": c.payment_mode,
                "payment_code": c.payment_code,
                "bank_code": c.bank_code,
                "branch_code": c.branch_code,
                "institution_code": c.institution_code,
                "institution_name": c.institution_name,
                "additional_info": c.additional_info,
                "transaction_date": str(c.transaction_date) if c.transaction_date else None,
                "payment_date": str(c.payment_date) if c.payment_date else None,
            }
        if obj.payment_method == "coop_stk":
            stk = MpesaSTKRequest.objects.filter(
                account_reference=obj.student_course.payment_reference
                if obj.student_course else None
            ).order_by("-created_at").first()
            if not stk:
                # fallback: checkout_request_id is embedded in description
                import re
                match = re.search(r"MessageRef: ([^,]+)", obj.description or "")
                if match:
                    stk = MpesaSTKRequest.objects.filter(
                        checkout_request_id=match.group(1).strip()
                    ).first()
            if stk:
                return {
                    "source": "coop_stk",
                    "checkout_request_id": stk.checkout_request_id,
                    "phone_number": stk.phone_number,
                    "amount": str(stk.amount),
                    "account_reference": stk.account_reference,
                    "status": stk.status,
                    "result_code": stk.result_code,
                    "result_desc": stk.result_desc,
                    "mpesa_receipt": stk.mpesa_receipt,
                    "created_at": str(stk.created_at),
                    "raw_payload": _safe_json(obj.data),
                }
        return None

    class Meta(PaymentTransactionSerializer.Meta):
        fields = PaymentTransactionSerializer.Meta.fields + ["source_detail"]
