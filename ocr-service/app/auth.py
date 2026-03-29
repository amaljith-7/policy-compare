import secrets

from fastapi import Header, HTTPException

from app.config import settings


def verify_api_key(x_api_key: str = Header(...)) -> str:
    if not settings.OCR_SERVICE_API_KEY:
        raise HTTPException(500, "OCR_SERVICE_API_KEY not configured")
    if not secrets.compare_digest(x_api_key, settings.OCR_SERVICE_API_KEY):
        raise HTTPException(401, "Invalid API key")
    return x_api_key
