import logging

import fitz  # PyMuPDF

from app.ocr import OCRResult

logger = logging.getLogger(__name__)


def mask_pdf(
    pdf_bytes: bytes,
    pages_pii: list[list[tuple[OCRResult, str]]],
    render_scale: float = 2.0,
) -> bytes:
    """Apply black redaction rectangles over PII regions in the PDF.

    Args:
        pdf_bytes: Original PDF bytes.
        pages_pii: Per-page list of (OCRResult, category) tuples to mask.
        render_scale: The scale used during OCR rendering (to convert coords back).

    Returns:
        Redacted PDF as bytes.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page_idx, pii_regions in enumerate(pages_pii):
        if page_idx >= len(doc):
            break
        if not pii_regions:
            continue

        page = doc[page_idx]
        page_rect = page.rect

        for ocr_result, _category in pii_regions:
            # OCR bounding boxes are in rendered image coordinates (at render_scale).
            # Convert back to PDF page coordinates.
            x0 = ocr_result.x_min / render_scale
            y0 = ocr_result.y_min / render_scale
            x1 = ocr_result.x_max / render_scale
            y1 = ocr_result.y_max / render_scale

            # Add padding
            padding = 2
            x0 = max(0, x0 - padding)
            y0 = max(0, y0 - padding)
            x1 = min(page_rect.width, x1 + padding)
            y1 = min(page_rect.height, y1 + padding)

            rect = fitz.Rect(x0, y0, x1, y1)

            # Add redaction annotation then apply it (properly removes underlying content)
            page.add_redact_annot(rect, fill=(0, 0, 0))

        page.apply_redactions()

    redacted_bytes = doc.tobytes()
    doc.close()
    return redacted_bytes
