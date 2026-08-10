import logging
import uuid
from datetime import datetime, timezone

import requests
from django.conf import settings

logger = logging.getLogger("payments")

PROD_BASE = "https://openapi.co-opbank.co.ke"


def _base_url() -> str:
    return PROD_BASE


# ─── Token ────────────────────────────────────────────────────────────────────

def generate_access_token() -> str:
    url  = f"{_base_url()}/token"
    resp = requests.post(
        url,
        headers={
            "Authorization": f"Basic {settings.COOP_BASIC_TOKEN}",
            "Content-Type":  "application/x-www-form-urlencoded",
        },
        data="grant_type=client_credentials",
        timeout=15,
    )
    resp.raise_for_status()
    token = resp.json()["access_token"]
    logger.info("Co-op: fetched fresh access token")
    return token


def invalidate_token() -> None:
    pass  # no-op — kept for call-site compatibility


# ─── STK Push ─────────────────────────────────────────────────────────────────

def _is_auth_error(exc: Exception) -> bool:
    return (
        isinstance(exc, requests.HTTPError)
        and exc.response is not None
        and exc.response.status_code in (401, 403)
    )


def initiate_stk_push(
    message_reference: str,
    payment_reference: str,
    phone: str,
    amount: int,
) -> dict:
    token = generate_access_token()
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    payload = {
        "MessageReference":    message_reference,
        "CallBackUrl":         settings.COOP_CALLBACK_URL,
        "OperatorCode":        settings.COOP_OPERATOR_CODE,
        "TransactionCurrency": "KES",
        "MobileNumber":        phone,
        "Narration":           payment_reference,
        "Amount":              amount,
        "MessageDateTime":     now,
        "OtherDetails": [
            {"Name": "payment_reference", "Value": payment_reference},
        ],
    }

    url = f"{_base_url()}/FT/stk/1.0.0/"

    def _do_push(tok):
        r = requests.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {tok}"},
            timeout=30,
        )
        r.raise_for_status()
        return r.json()

    try:
        data = _do_push(token)
    except Exception as exc:
        if _is_auth_error(exc):
            logger.warning("Co-op STK Push got 401/403 — invalidating token and retrying once")
            invalidate_token()
            data = _do_push(_fetch_fresh_token())
        else:
            raise

    logger.info(f"Co-op STK Push initiated: ref={message_reference} data={data}")
    return data


# ─── Enquiry ──────────────────────────────────────────────────────────────────

def get_stk_status(message_reference: str) -> dict:
    token = generate_access_token()
    url   = f"{_base_url()}/Enquiry/STK/1.0.0/"

    def _do_enquiry(tok):
        r = requests.post(
            url,
            json={"MessageReference": message_reference},
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()

    try:
        return _do_enquiry(token)
    except Exception as exc:
        if _is_auth_error(exc):
            logger.warning("Co-op STK enquiry got 401/403 — invalidating token and retrying once")
            invalidate_token()
            return _do_enquiry(_fetch_fresh_token())
        raise


# ─── Response interpreter ─────────────────────────────────────────────────────

def interpret_enquiry_response(data: dict) -> dict:
    description = (data.get("MessageDescription") or "").strip()
    desc_lower  = description.lower()
    code        = str(data.get("MessageCode") or "").strip()

    # Co-op may put the transaction reference in different fields depending on
    # API version — try all known variants in order of likelihood.
    transaction_reference = (
        data.get("TransactionReference")
        or data.get("TransactionID")
        or data.get("TransactionRef")
        or data.get("MpesaReceiptNumber")
        or ""
    ) or None

    # ── Pending ───────────────────────────────────────────────────────────────
    if any(phrase in desc_lower for phrase in (
        "accepted for processing",
        "request accepted",
        "still processing",
        "in progress",
    )):
        return {"status": "pending", "result_desc": description, "transaction_reference": None}

    # ── Success — match on "successful" or "full success" to catch all Co-op variants ────
    if "successful" in desc_lower or "full success" in desc_lower:
        # Transaction reference may be buried in TransactionMetadata.Items
        # e.g. Narration value: "BUR008~UEUAV63XEV~2026-05-30" — receipt is segment [1]
        if not transaction_reference:
            items = (data.get("TransactionMetadata") or {}).get("Items", [])
            for item in items:
                if (item.get("Name") or "").lower() == "narration":
                    parts = (item.get("Value") or "").split("~")
                    if len(parts) >= 2 and parts[1].strip():
                        transaction_reference = parts[1].strip()
                    break
                if (item.get("Name") or "").lower() in ("transactionreference", "receiptno", "receipt"):
                    transaction_reference = item.get("Value") or None
                    break
        return {
            "status":                "success",
            "result_desc":           description,
            "transaction_reference": transaction_reference,
        }

    # ── Failed / Cancelled ────────────────────────────────────────────────────
    FAILURE_PHRASES = (
        "no response from user",
        "cancelled by user",
        "user cancelled",
        "insufficient funds",
        "invalid mobile number",
        "invalid account",
        "debit account authorization failure",
        "wrong pin",
        "pin retries exceeded",
        "transaction expired",
        "request timeout",
        "limit exceeded",
        "declined",
        "rejected",
        "failed",
        "error while initiating",
    )
    # Documented Co-op STK failure codes — -8 = debit auth failure (unregistered/blocked number)
    FAILURE_CODES = {"1037", "1032", "1025", "1026", "1001", "2001", "9999", "-8", "-13", "400"}

    if any(phrase in desc_lower for phrase in FAILURE_PHRASES) or code in FAILURE_CODES:
        return {"status": "failed", "result_desc": description, "transaction_reference": None}

    # ── Unknown ───────────────────────────────────────────────────────────────
    logger.warning(
        "Co-op STK enquiry unknown response — code=%r desc=%r full_payload=%r",
        code, description, data,
    )
    return {"status": "unknown", "result_desc": description, "transaction_reference": None}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_message_reference(payment_reference: str) -> str:
    """
    Generate a unique Co-op MessageReference (exactly 13 characters).
    Format: <first-5-chars-of-payment_reference><8-char-hex-suffix>
    e.g. payment_reference="ADM001-A"  →  "ADM0012F9E8C71"[:13]  →  "ADM0012F9E8C7"
    """
    prefix = (payment_reference or "")[:5].upper()
    suffix = uuid.uuid4().hex[:8].upper()
    return f"{prefix}{suffix}"[:13]