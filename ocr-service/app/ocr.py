import logging

import easyocr
import numpy as np
import pypdfium2 as pdfium

from app.config import settings

logger = logging.getLogger(__name__)

_reader: easyocr.Reader | None = None


def get_reader() -> easyocr.Reader:
    """Lazy-initialized EasyOCR reader singleton."""
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(
            settings.OCR_LANGUAGES,
            gpu=False,
        )
    return _reader


class OCRResult:
    """Holds OCR text + bounding box for a single detected text region."""

    def __init__(self, bbox: list[list[int]], text: str, confidence: float):
        # bbox format from EasyOCR: [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
        self.bbox = bbox
        self.text = text
        self.confidence = confidence

    @property
    def x_min(self) -> float:
        return min(p[0] for p in self.bbox)

    @property
    def y_min(self) -> float:
        return min(p[1] for p in self.bbox)

    @property
    def x_max(self) -> float:
        return max(p[0] for p in self.bbox)

    @property
    def y_max(self) -> float:
        return max(p[1] for p in self.bbox)


def ocr_pdf_pages(pdf_bytes: bytes) -> list[list[OCRResult]]:
    """Run EasyOCR on each page of a PDF.

    Returns a list of pages, each containing a list of OCRResult objects.
    """
    reader = get_reader()
    doc = pdfium.PdfDocument(pdf_bytes)
    all_pages = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        bitmap = page.render(scale=2)
        image = bitmap.to_pil()
        img_array = np.array(image)

        results = reader.readtext(img_array)
        page_results = []

        for bbox, text, confidence in results:
            # EasyOCR returns bbox as [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
            page_results.append(OCRResult(bbox, text, confidence))

        all_pages.append(page_results)

    doc.close()
    return all_pages
