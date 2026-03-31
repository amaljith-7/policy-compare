import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.ocr import get_reader
from app.router import router
from app.schemas import HealthResponse

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Pre-loading EasyOCR models...")
    get_reader()
    logger.info("EasyOCR models loaded.")
    yield


app = FastAPI(title="PDF PII Masking Service", lifespan=lifespan)
app.include_router(router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        ocr_engine="easyocr",
    )
