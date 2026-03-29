FROM python:3.12-slim

WORKDIR /app

# System deps for Docling/Surya (OpenCV, image processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1

EXPOSE 8200

# Single worker: Surya models are memory-heavy (~2-4GB)
# 300s timeout for large multi-page PDFs
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8200", "--workers", "1", "--timeout-keep-alive", "300"]
