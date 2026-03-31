import base64
import json
import logging
import os

import httpx
from openai import OpenAI

logger = logging.getLogger(__name__)

OCR_SERVICE_URL = os.environ.get("OCR_SERVICE_URL", "http://ocr-service:8200")
OCR_SERVICE_API_KEY = os.environ.get("OCR_SERVICE_API_KEY", "")
OCR_SERVICE_TIMEOUT = int(os.environ.get("OCR_SERVICE_TIMEOUT", "120"))

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

# Fields that are extracted locally (PII) vs sent to OpenAI
PII_FIELDS = {'customer', 'insured_name', 'email', 'mobile_number'}
OPENAI_FIELDS = [f for f in DEFAULT_FIELDS if f not in PII_FIELDS]


def _mask_pdf(pdf_bytes: bytes) -> tuple[str, dict]:
    """Call the masking microservice. Returns (masked_pdf_base64, pii_fields)."""
    url = f"{OCR_SERVICE_URL}/api/v1/mask"
    headers = {"X-API-Key": OCR_SERVICE_API_KEY}

    try:
        with httpx.Client(timeout=OCR_SERVICE_TIMEOUT) as client:
            response = client.post(
                url,
                headers=headers,
                files={"pdf": ("quote.pdf", pdf_bytes, "application/pdf")},
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"Masking service returned {e.response.status_code}: {e.response.text}")
        raise RuntimeError(f"Masking service error: {e.response.text}")
    except httpx.RequestError as e:
        logger.error(f"Masking service request failed: {e}")
        raise RuntimeError(f"Masking service unavailable: {e}")

    result = response.json()
    return result["masked_pdf_base64"], result.get("pii_fields", {})


def _extract_with_openai(masked_pdf_base64: str, product_type: str) -> dict:
    """Send the masked PDF to OpenAI for non-PII field extraction."""
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

    fields_description = ', '.join(
        [f'"{f}" ({FIELD_LABELS[f]})' for f in OPENAI_FIELDS]
    )

    system_prompt = f"""You are an insurance document data extractor. Extract the following fields from the insurance quote PDF.
Product type: {product_type}

Fields to extract: {fields_description}

Note: Personal information (names, email, phone) has been redacted from this document.
Only extract the financial and policy fields listed above.

Field variation hints:
- "Policy Type" may appear as "Type of Policy", "Coverage Type", or "Plan"
- "Premium" may appear as "Premium Amount" or "Base Premium"
- "VAT 5%" may appear as "VAT", "Tax", or "Value Added Tax"
- "Excess" may appear as "Deductible"
- "Total Payable" may appear as "Total Amount", "Amount Due", or "Grand Total"
- "Insured Value" may appear as "Sum Insured", "Coverage Amount", or "Vehicle Value"

Return a JSON object with exactly these keys. If a field is not found, use "N/A" as the value.
All values should be strings. For monetary amounts, include the currency symbol.
Return ONLY valid JSON, no markdown formatting."""

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model='gpt-4o',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'file',
                                'file': {
                                    'filename': 'quote.pdf',
                                    'file_data': f'data:application/pdf;base64,{masked_pdf_base64}',
                                },
                            },
                            {
                                'type': 'text',
                                'text': 'Extract the insurance quote data from this PDF document.',
                            },
                        ],
                    },
                ],
                response_format={'type': 'json_object'},
                max_tokens=2000,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            if attempt == 0:
                continue
            raise e


def extract_from_pdf(pdf_bytes: bytes, product_type: str) -> dict:
    """Extract fields from a PDF using privacy-preserving pipeline.

    1. Send PDF to masking service → get masked PDF + PII fields
    2. Send masked PDF to OpenAI → get non-PII fields
    3. Merge both into final result
    """
    # Step 1: Mask PII locally
    masked_pdf_b64, pii_fields = _mask_pdf(pdf_bytes)

    # Step 2: Send masked PDF to OpenAI for remaining fields
    openai_fields = _extract_with_openai(masked_pdf_b64, product_type)

    # Step 3: Merge — PII from local OCR, rest from OpenAI
    result = {}
    for field in DEFAULT_FIELDS:
        if field in PII_FIELDS and field in pii_fields:
            result[field] = pii_fields[field]
        elif field in openai_fields:
            result[field] = openai_fields[field]
        else:
            result[field] = 'N/A'

    return result
