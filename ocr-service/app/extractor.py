import json
import logging

from openai import OpenAI

from app.config import settings
from app.fields import FieldDef, get_fields

logger = logging.getLogger(__name__)


def _build_prompt(
    ocr_text: str, product_type: str, fields: list[FieldDef]
) -> tuple[str, str]:
    fields_desc = "\n".join(
        f'- "{f["key"]}" ({f["label"]}): look for {", ".join(f["hints"])}'
        for f in fields
    )
    keys_list = ", ".join(f'"{f["key"]}' for f in fields)

    system = f"""You are an insurance document data extractor.
Extract fields from the OCR text of an insurance quote document.
Product type: {product_type}

Fields to extract:
{fields_desc}

Return a JSON object with these exact keys: [{keys_list}].
Each value must be an object: {{"value": "<extracted value>", "confidence": <0.0-1.0>}}
- "value": the extracted string. For monetary amounts include currency symbol. Use "N/A" if not found.
- "confidence": your confidence the extraction is correct (1.0 = certain, 0.0 = guessing).

Return ONLY valid JSON. No markdown, no explanation."""

    user = f"Extract insurance quote data from this OCR text:\n\n{ocr_text}"
    return system, user


def extract_fields(
    ocr_text: str, product_type: str
) -> tuple[dict, bool, str | None]:
    """Extract structured fields from OCR text using OpenAI.

    Returns (fields_dict, is_partial, error_message).
    """
    fields = get_fields(product_type)
    system, user = _build_prompt(ocr_text, product_type, fields)
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                response_format={"type": "json_object"},
                max_tokens=settings.OPENAI_MAX_TOKENS,
                timeout=settings.OPENAI_TIMEOUT,
            )
            result = json.loads(response.choices[0].message.content)

            normalized = {}
            for f in fields:
                val = result.get(f["key"], {"value": "N/A", "confidence": 0.0})
                if isinstance(val, str):
                    val = {"value": val, "confidence": 0.5}
                normalized[f["key"]] = {
                    "value": val.get("value", "N/A"),
                    "confidence": float(val.get("confidence", 0.5)),
                }
            return normalized, False, None

        except Exception as e:
            logger.warning(f"OpenAI attempt {attempt + 1} failed: {e}")
            if attempt == 0:
                continue
            empty = {
                f["key"]: {"value": "N/A", "confidence": 0.0} for f in fields
            }
            return empty, True, str(e)
