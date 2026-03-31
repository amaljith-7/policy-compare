import base64
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth import verify_api_key
from app.config import settings
from app.masker import mask_pdf
from app.ocr import ocr_pdf_pages
from app.pii_detector import detect_pii
from app.schemas import MaskResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/mask",
    response_model=MaskResponse,
    dependencies=[Depends(verify_api_key)],
)
async def mask_endpoint(
    pdf: UploadFile = File(...),
):
    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    pdf_bytes = await pdf.read()
    if len(pdf_bytes) > settings.MAX_PDF_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"PDF exceeds {settings.MAX_PDF_SIZE_MB}MB limit")

    # Step 1: OCR all pages
    try:
        all_pages = ocr_pdf_pages(pdf_bytes)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(422, f"OCR failed: {e}")

    # Step 2: Detect PII on each page
    pages_pii = []
    # Collect PII values: category -> list of text fragments
    pii_collected: dict[str, list[str]] = {}

    for page_results in all_pages:
        page_pii = detect_pii(page_results)
        pages_pii.append(page_pii)

        for ocr_result, category in page_pii:
            if category not in pii_collected:
                pii_collected[category] = []
            pii_collected[category].append(ocr_result.text)

    # Step 3: Build PII fields dict
    pii_fields: dict[str, str] = {}

    # Handle name fields: "customer" gets first name detection, "name" gets second
    customer_names = pii_collected.get("customer", [])
    insured_names = pii_collected.get("name", [])

    if customer_names:
        pii_fields["customer"] = " ".join(customer_names[:2]).strip()
    if insured_names:
        pii_fields["insured_name"] = " ".join(insured_names[:2]).strip()
    elif len(customer_names) > 2:
        # If no separate "insured name" label, use extra customer names
        pii_fields["insured_name"] = " ".join(customer_names[2:4]).strip()

    email_texts = pii_collected.get("email", [])
    if email_texts:
        pii_fields["email"] = email_texts[0]

    mobile_texts = pii_collected.get("mobile", [])
    if mobile_texts:
        pii_fields["mobile_number"] = mobile_texts[0]

    # Step 4: Mask the PDF
    try:
        masked_pdf_bytes = mask_pdf(pdf_bytes, pages_pii)
    except Exception as e:
        logger.error(f"PDF masking failed: {e}")
        raise HTTPException(422, f"PDF masking failed: {e}")

    masked_pdf_b64 = base64.standard_b64encode(masked_pdf_bytes).decode("utf-8")

    return MaskResponse(
        success=True,
        masked_pdf_base64=masked_pdf_b64,
        pii_fields=pii_fields,
    )
