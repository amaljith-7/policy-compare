import logging
import os

import httpx

logger = logging.getLogger(__name__)

OCR_SERVICE_URL = os.environ.get("OCR_SERVICE_URL", "http://ocr-service:8200")
OCR_SERVICE_API_KEY = os.environ.get("OCR_SERVICE_API_KEY", "")
OCR_SERVICE_TIMEOUT = int(os.environ.get("OCR_SERVICE_TIMEOUT", "300"))

DEFAULT_FIELDS = [
    'customer',
    'insured_name',
    'email',
    'mobile_number',
    'policy_type',
    'premium',
    'vat_5_percent',
    'excess',
    'total_payable',
    'insured_value',
]

FIELD_LABELS = {
    'customer': 'Customer',
    'insured_name': 'Insured Name',
    'email': 'Email',
    'mobile_number': 'Mobile Number',
    'policy_type': 'Policy Type',
    'premium': 'Premium',
    'vat_5_percent': 'VAT 5%',
    'excess': 'Excess',
    'total_payable': 'Total Payable',
    'insured_value': 'Insured Value',
}


def extract_from_pdf(pdf_bytes: bytes, product_type: str) -> dict:
    """Call the OCR microservice to extract fields from a PDF."""
    url = f"{OCR_SERVICE_URL}/api/v1/extract"
    headers = {"X-API-Key": OCR_SERVICE_API_KEY}

    try:
        with httpx.Client(timeout=OCR_SERVICE_TIMEOUT) as client:
            response = client.post(
                url,
                headers=headers,
                files={"pdf": ("quote.pdf", pdf_bytes, "application/pdf")},
                data={"product_type": product_type},
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"OCR service returned {e.response.status_code}: {e.response.text}")
        raise RuntimeError(f"OCR service error: {e.response.text}")
    except httpx.RequestError as e:
        logger.error(f"OCR service request failed: {e}")
        raise RuntimeError(f"OCR service unavailable: {e}")

    result = response.json()

    if result.get("partial"):
        logger.warning(f"Partial extraction: {result.get('error')}")

    # Flatten {key: {value, confidence}} to {key: value} for backward compatibility
    fields = {}
    for key in DEFAULT_FIELDS:
        field_data = result.get("fields", {}).get(key, {})
        if isinstance(field_data, dict):
            fields[key] = field_data.get("value", "N/A")
        else:
            fields[key] = str(field_data) if field_data else "N/A"

    return fields
