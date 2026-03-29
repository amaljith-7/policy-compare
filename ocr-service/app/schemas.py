from pydantic import BaseModel


class FieldResult(BaseModel):
    value: str
    confidence: float


class ExtractionResponse(BaseModel):
    success: bool
    fields: dict[str, FieldResult]
    raw_ocr_text: str
    ocr_engine: str = "surya+docling"
    llm_model: str
    partial: bool = False
    error: str | None = None


class HealthResponse(BaseModel):
    status: str
    ocr_engine: str
    llm_model: str
