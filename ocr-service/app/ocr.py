import logging
import os
import tempfile

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_surya import SuryaOcrOptions
from surya.detection import DetectionPredictor
from surya.foundation import FoundationPredictor
from surya.recognition import RecognitionPredictor

from app.config import settings

logger = logging.getLogger(__name__)


def _patch_surya_decoder_config() -> None:
    """Patch SuryaDecoderConfig to inject pad_token_id.

    surya-ocr 0.17.x doesn't set pad_token_id in SuryaDecoderConfig.__init__,
    but transformers 5.x requires it as an explicit attribute (no longer defaults
    to None). Patch at import time so it runs before any surya model is loaded.
    """
    try:
        from surya.common.surya.decoder.config import SuryaDecoderConfig

        _orig = SuryaDecoderConfig.__init__

        def _patched(self, *args, **kwargs):
            kwargs.setdefault("pad_token_id", 0)
            _orig(self, *args, **kwargs)
            if not hasattr(self, "pad_token_id"):
                self.pad_token_id = 0

        SuryaDecoderConfig.__init__ = _patched
    except Exception:
        pass


_patch_surya_decoder_config()

_converter: DocumentConverter | None = None
_foundation_predictor: FoundationPredictor | None = None
_recognition_predictor: RecognitionPredictor | None = None
_detection_predictor: DetectionPredictor | None = None


def get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        pipeline_options = PdfPipelineOptions(
            do_ocr=True,
            ocr_model="suryaocr",
            allow_external_plugins=True,
            ocr_options=SuryaOcrOptions(lang=settings.OCR_LANGUAGES),
            images_scale=2.0,
        )
        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            }
        )
    return _converter


def _get_surya_predictors():
    global _foundation_predictor, _recognition_predictor, _detection_predictor
    if _foundation_predictor is None:
        _foundation_predictor = FoundationPredictor()
        _recognition_predictor = RecognitionPredictor(_foundation_predictor)
        _detection_predictor = DetectionPredictor()
    return _recognition_predictor, _detection_predictor


def _surya_direct_ocr(pdf_bytes: bytes) -> str:
    """Use Surya directly to OCR all pages of a PDF."""
    import pypdfium2 as pdfium
    from PIL import Image

    recognition_predictor, detection_predictor = _get_surya_predictors()

    doc = pdfium.PdfDocument(pdf_bytes)
    all_text = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        # Render at 2x for better OCR quality
        bitmap = page.render(scale=2)
        image = bitmap.to_pil()

        predictions = recognition_predictor(
            [image], det_predictor=detection_predictor
        )
        page_lines = []
        for pred in predictions:
            for line in pred.text_lines:
                page_lines.append(line.text)

        if page_lines:
            all_text.append(f"--- Page {page_idx + 1} ---")
            all_text.append("\n".join(page_lines))

    doc.close()
    return "\n\n".join(all_text)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Run OCR on PDF bytes and return extracted text.

    Tries Docling+Surya first. If the result is mostly image placeholders
    (scanned/image-based PDF), falls back to direct Surya OCR.
    """
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        tmp_path = f.name

    try:
        # Try Docling first (better for structured/digital PDFs)
        converter = get_converter()
        result = converter.convert(tmp_path)
        markdown = result.document.export_to_markdown()

        # Check if Docling produced useful text or just image placeholders
        text_content = markdown.replace("<!-- image -->", "").strip()
        if len(text_content) > 100:
            logger.info("Docling produced good text output")
            return markdown

        # Fallback: direct Surya OCR for image-heavy PDFs
        logger.info(
            "Docling output mostly images, falling back to direct Surya OCR"
        )
        return _surya_direct_ocr(pdf_bytes)
    finally:
        os.unlink(tmp_path)
