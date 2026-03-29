import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.auth import verify_api_key
from app.config import settings
from app.extractor import extract_fields
from app.ocr import extract_text_from_pdf
from app.schemas import ExtractionResponse, FieldResult

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/extract",
    response_model=ExtractionResponse,
    dependencies=[Depends(verify_api_key)],
)
async def extract(
    pdf: UploadFile = File(...),
    product_type: str = Form("MOTOR"),
):
    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    pdf_bytes = await pdf.read()
    if len(pdf_bytes) > settings.MAX_PDF_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"PDF exceeds {settings.MAX_PDF_SIZE_MB}MB limit")

    # Step 1: Local OCR via Surya+Docling
    try:
        ocr_text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(422, f"OCR failed: {e}")

    if not ocr_text.strip():
        raise HTTPException(422, "OCR produced no text from the PDF")

    # Step 2: Field extraction via OpenAI
    fields_raw, is_partial, error = extract_fields(ocr_text, product_type)

    fields = {k: FieldResult(**v) for k, v in fields_raw.items()}

    return ExtractionResponse(
        success=not is_partial,
        fields=fields,
        raw_ocr_text=ocr_text,
        llm_model=settings.OPENAI_MODEL,
        partial=is_partial,
        error=error,
    )
