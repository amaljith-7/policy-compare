from pydantic import BaseModel


class MaskResponse(BaseModel):
    success: bool
    masked_pdf_base64: str
    pii_fields: dict[str, str]  # e.g. {"customer": "JOSE POULOSE", "email": "..."}
    error: str | None = None


class HealthResponse(BaseModel):
    status: str
    ocr_engine: str
