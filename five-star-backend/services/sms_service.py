import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

ONFON_URL = "https://api.onfonmedia.co.ke/v1/sms/SendBulkSMS"


def normalize_phone(phone: str) -> str:
    """Convert 07XX or +2547XX to 2547XX format for Onfon."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+254"):
        return phone[1:]  # Remove +
    if phone.startswith("254"):
        return phone
    if phone.startswith("0"):
        return "254" + phone[1:]  # 07XX -> 2547XX
    return phone


def send_sms(to: str, message: str) -> dict:
    """Sends SMS via Onfon API. Returns structured response dict."""
    normalized = normalize_phone(to)
    payload = {
        "ApiKey": settings.ONFON_API_KEY,
        "ClientId": settings.ONFON_CLIENT_ID,
        "SenderId": settings.ONFON_SENDER_ID,
        "MessageParameters": [
            {"Number": normalized, "Text": message}
        ],
    }
    try:
        resp = requests.post(
            ONFON_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"success": True, "data": data}
    except requests.Timeout:
        logger.error("Onfon SMS timeout for %s", to)
        return {"success": False, "error": "timeout"}
    except requests.RequestException as e:
        logger.error("Onfon SMS error for %s: %s", to, str(e))
        return {"success": False, "error": str(e)}
