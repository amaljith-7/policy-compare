import logging
import re

from app.config import settings
from app.ocr import OCRResult

logger = logging.getLogger(__name__)

# Regex patterns for direct PII detection
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+\s*[@C]\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"^\+?\d[\d\s\-]{7,15}$")

# PII field labels — must match closely to avoid false positives
# Maps: normalized label text -> PII category
LABEL_TO_CATEGORY: dict[str, str] = {
    "full name": "name",
    "insured name": "name",
    "name of insured": "name",
    "policyholder": "name",
    "customer name": "customer",
    "client name": "customer",
    "email address": "email",
    "email": "email",
    "e-mail": "email",
    "mobile number": "mobile",
    "phone number": "mobile",
    "contact number": "mobile",
    "chassis no": "vehicle_id",
    "chassis number": "vehicle_id",
    "vin": "vehicle_id",
    "registration no": "vehicle_id",
    "reg no": "vehicle_id",
    "plate no": "vehicle_id",
    "plate number": "vehicle_id",
    "vehicle no": "vehicle_id",
    "tc no": "vehicle_id",
    "traffic file no": "vehicle_id",
    "driving license issue date": "license_date",
    "driver dob": "driver_dob",
}

# Section headers that indicate PII sections (values after these may be names)
PII_SECTION_HEADERS = {"personal details", "customer details"}

# Minimum y coordinate for valid text (filter out headers/logos)
MIN_Y = 200  # in scale=2 coords


def _normalize(text: str) -> str:
    return text.lower().strip().rstrip(":").strip()


def _match_label(text: str) -> str | None:
    """Match text against known PII label keywords. Returns category or None."""
    normalized = _normalize(text)
    # Exact match first
    if normalized in LABEL_TO_CATEGORY:
        return LABEL_TO_CATEGORY[normalized]
    # Substring match (e.g., "Full Name :" matches "full name")
    for label, category in LABEL_TO_CATEGORY.items():
        if label == normalized or (len(label) > 4 and label in normalized):
            return category
    return None


def _is_section_header(text: str) -> bool:
    return _normalize(text) in PII_SECTION_HEADERS


def _same_row(a: OCRResult, b: OCRResult) -> bool:
    """Check if two OCR results are on the same row (vertical overlap)."""
    v_overlap = min(a.y_max, b.y_max) - max(a.y_min, b.y_min)
    min_height = min(a.y_max - a.y_min, b.y_max - b.y_min)
    return v_overlap > min_height * 0.3


def _is_right_of(label: OCRResult, candidate: OCRResult) -> bool:
    """Check if candidate is to the right of label on the same row."""
    if not _same_row(label, candidate):
        return False
    h_gap = candidate.x_min - label.x_max
    return -30 < h_gap < 600


def _is_below(label: OCRResult, candidate: OCRResult, max_gap: float = 80) -> bool:
    """Check if candidate is directly below label."""
    v_gap = candidate.y_min - label.y_max
    # Must be below but not too far
    if not (0 < v_gap < max_gap):
        return False
    # Must have horizontal overlap (same column area)
    return candidate.x_min < label.x_max + 200


def _is_footer(result: OCRResult, page_height: float) -> bool:
    """Filter out footer text (bottom 10% of page)."""
    return result.y_min > page_height * 0.9


def detect_pii(
    page_results: list[OCRResult],
) -> list[tuple[OCRResult, str]]:
    """Detect PII regions on a single page."""
    if not page_results:
        return []

    # Estimate page height from max y coordinate
    page_height = max(r.y_max for r in page_results) if page_results else 2000

    pii_regions: list[tuple[OCRResult, str]] = []
    used_indices: set[int] = set()

    # Strategy 1: Label-based detection
    for i, result in enumerate(page_results):
        if _is_footer(result, page_height):
            continue

        category = _match_label(result.text)
        if not category:
            continue

        # Find value(s) to the right of this label
        right_candidates = []
        below_candidates = []

        for j, candidate in enumerate(page_results):
            if j == i or j in used_indices or _is_footer(candidate, page_height):
                continue
            # Skip if candidate is also a label or section header
            if _match_label(candidate.text) or _is_section_header(candidate.text):
                continue

            if _is_right_of(result, candidate):
                right_candidates.append((j, candidate))
            elif _is_below(result, candidate):
                below_candidates.append((j, candidate))

        # Sort right candidates by x position (leftmost first)
        right_candidates.sort(key=lambda x: x[1].x_min)
        # Sort below candidates by y position (topmost first)
        below_candidates.sort(key=lambda x: x[1].y_min)

        # For name fields, take the right candidate + first below candidate
        if category in ("name", "customer"):
            for j, candidate in right_candidates[:1]:
                pii_regions.append((candidate, category))
                used_indices.add(j)
            for j, candidate in below_candidates[:1]:
                # Only if it's in the same x-column as the right candidate
                if right_candidates:
                    ref_x = right_candidates[0][1].x_min
                    if abs(candidate.x_min - ref_x) < 100:
                        pii_regions.append((candidate, category))
                        used_indices.add(j)
        elif category in ("license_date", "driver_dob"):
            # Mask the date value
            for j, candidate in right_candidates[:1]:
                pii_regions.append((candidate, category))
                used_indices.add(j)
        else:
            # For email, mobile, vehicle_id — take just the right value
            for j, candidate in right_candidates[:1]:
                pii_regions.append((candidate, category))
                used_indices.add(j)

    # Strategy 2: Section header detection for standalone names
    # e.g., "Personal Details" followed by a name like "JOSE POULOSE"
    for i, result in enumerate(page_results):
        if _is_footer(result, page_height):
            continue
        if not _is_section_header(result.text):
            continue

        # Look for text below the section header that could be a name
        for j, candidate in enumerate(page_results):
            if j == i or j in used_indices or _is_footer(candidate, page_height):
                continue
            if _match_label(candidate.text) or _is_section_header(candidate.text):
                continue

            v_gap = candidate.y_min - result.y_max
            if 0 < v_gap < 60:
                # Check if it looks like a name (mostly uppercase letters)
                text = candidate.text.strip()
                if (
                    len(text) > 3
                    and text.replace(" ", "").isalpha()
                    and text == text.upper()
                ):
                    pii_regions.append((candidate, "customer"))
                    used_indices.add(j)
                    break  # Only take the first one

    # Strategy 3: Regex-based fallback for emails and phones not caught by labels
    for i, result in enumerate(page_results):
        if i in used_indices or _is_footer(result, page_height):
            continue

        text = result.text.strip()
        if EMAIL_PATTERN.search(text):
            pii_regions.append((result, "email"))
            used_indices.add(i)
        elif PHONE_PATTERN.match(text):
            # Extra check: must be in the left-ish part of page (not a financial figure)
            if result.x_min < 600:
                pii_regions.append((result, "mobile"))
                used_indices.add(i)

    return pii_regions
