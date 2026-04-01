import logging

from surya.detection import DetectionPredictor
from surya.foundation import FoundationPredictor
from surya.recognition import RecognitionPredictor

logger = logging.getLogger(__name__)


def _patch_transformers_rope() -> None:
    """Patch transformers 5.x incompatibilities with surya-ocr 0.17.x.

    1. SuryaDecoderConfig missing pad_token_id — transformers 5.x no longer
       provides it as a default via PretrainedConfig.
    2. ROPE_INIT_FUNCTIONS missing 'default' key — transformers 5.x removed
       the 'default' entry; surya falls back to rope_type='default' when
       rope_scaling is None.
    """
    try:
        from surya.common.surya.decoder.config import SuryaDecoderConfig

        if not hasattr(SuryaDecoderConfig, "pad_token_id"):
            SuryaDecoderConfig.pad_token_id = 0
    except Exception:
        pass

    try:
        import torch
        from transformers.modeling_rope_utils import ROPE_INIT_FUNCTIONS

        if "default" not in ROPE_INIT_FUNCTIONS:

            def _compute_default_rope_parameters(config, device=None, seq_len=None, **kwargs):
                head_dim = getattr(config, "head_dim", None) or (
                    config.hidden_size // config.num_attention_heads
                )
                base = getattr(config, "rope_theta", 10000.0)
                inv_freq = 1.0 / (
                    base
                    ** (
                        torch.arange(0, head_dim, 2, dtype=torch.int64).to(
                            device=device, dtype=torch.float
                        )
                        / head_dim
                    )
                )
                return inv_freq, 1.0

            ROPE_INIT_FUNCTIONS["default"] = _compute_default_rope_parameters
    except Exception:
        pass


_patch_transformers_rope()

_foundation_predictor: FoundationPredictor | None = None
_recognition_predictor: RecognitionPredictor | None = None
_detection_predictor: DetectionPredictor | None = None


def _get_surya_predictors():
    global _foundation_predictor, _recognition_predictor, _detection_predictor
    if _foundation_predictor is None:
        _foundation_predictor = FoundationPredictor()
        _recognition_predictor = RecognitionPredictor(_foundation_predictor)
        _detection_predictor = DetectionPredictor()
    return _recognition_predictor, _detection_predictor


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Run OCR on PDF bytes and return extracted text using direct Surya OCR."""
    import pypdfium2 as pdfium

    recognition_predictor, detection_predictor = _get_surya_predictors()

    doc = pdfium.PdfDocument(pdf_bytes)
    all_text = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
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

    page_count = len(doc)
    doc.close()
    logger.info("Direct Surya OCR complete, %d pages processed", page_count)
    return "\n\n".join(all_text)
