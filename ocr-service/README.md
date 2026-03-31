# PDF PII Masking Microservice

A lightweight FastAPI service that detects and masks personally identifiable information (PII) in insurance quote PDFs before they are sent to external AI services for data extraction.

## How It Works

```
PDF Upload → EasyOCR (detect text + bounding boxes)
           → PII Detection (keyword proximity + regex)
           → Extract PII values locally
           → PyMuPDF redaction (black bars over PII regions)
           → Return masked PDF + extracted PII fields
```

### What Gets Masked

| Category | Fields Detected | Detection Method |
|----------|----------------|------------------|
| Names | Customer name, Insured name | Label proximity ("Full Name", "Customer Name", etc.) + uppercase text near section headers |
| Contact | Email, Mobile number | Label proximity + regex fallback |
| Dates | Driver DOB, License issue date | Label proximity |
| Vehicle | Chassis no, Registration no, Plate no | Label proximity |

### Integration with Django Backend

```
1. User uploads PDF → Django backend
2. Django sends PDF to this service → returns masked PDF + PII fields
3. Django sends masked PDF to OpenAI gpt-4o → extracts financial/policy fields
4. Django merges PII (local) + OpenAI fields → returns all 10 fields to frontend
```

OpenAI only ever sees the redacted document — no names, emails, phones, or dates of birth leave your infrastructure.

## Setup

### Prerequisites

- Docker with at least 4GB memory allocated
- Or Python 3.12+ for local development

### Environment Variables

Copy the example env file and set your API key:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OCR_SERVICE_API_KEY` | Yes | - | Shared secret for authenticating requests from the Django backend |
| `OCR_LANGUAGES` | No | `["en","ar"]` | Languages for EasyOCR (English + Arabic by default) |
| `MAX_PDF_SIZE_MB` | No | `20` | Maximum upload size |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity |

### Run with Docker

```bash
# Build
docker build -t ocr-service .

# Run
docker run -d --name ocr-service -p 8200:8200 --env-file .env ocr-service
```

First startup downloads EasyOCR models (~200MB). Subsequent starts are instant.

### Run with Docker Compose (standalone)

```bash
docker compose up --build
```

### Run with the full application stack

From the project root:

```bash
docker compose up --build
```

This starts the masking service alongside the Django backend, frontend, and database.

### Run locally (development)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8200 --reload
```

## API

### `GET /health`

Health check.

```bash
curl http://localhost:8200/health
```

```json
{"status": "ok", "ocr_engine": "easyocr"}
```

### `POST /api/v1/mask`

Mask PII in a PDF and return the redacted PDF + extracted PII fields.

**Headers:** `X-API-Key: <your-shared-secret>`

**Body:** `multipart/form-data` with `pdf` file field

```bash
curl -X POST http://localhost:8200/api/v1/mask \
  -H "X-API-Key: your-shared-secret" \
  -F "pdf=@quote.pdf"
```

**Response:**

```json
{
  "success": true,
  "masked_pdf_base64": "<base64-encoded redacted PDF>",
  "pii_fields": {
    "customer": "JOSE POULOSE",
    "insured_name": "POULOSE CHITTILAPILLY ANTON",
    "email": "motor11@pibsecure.com",
    "mobile_number": "506034375"
  },
  "error": null
}
```

**Error codes:**
- `400` — Not a PDF or exceeds size limit
- `401` — Missing or invalid API key
- `422` — OCR or masking failed

## Performance

| Environment | OCR + Masking Time (3-page PDF) |
|-------------|-------------------------------|
| CPU (Docker, 4 cores) | ~3 minutes |
| GPU (NVIDIA) | ~10-20 seconds |
| Apple Silicon (native) | ~30-60 seconds |

The service uses a single worker because EasyOCR models consume ~1-2GB RAM. For higher throughput, scale horizontally with multiple container instances.

## Project Structure

```
ocr-service/
├── app/
│   ├── main.py           # FastAPI app, lifespan (pre-loads models), health endpoint
│   ├── config.py          # Settings via pydantic-settings
│   ├── auth.py            # X-API-Key header authentication
│   ├── router.py          # POST /api/v1/mask endpoint
│   ├── ocr.py             # EasyOCR wrapper: PDF pages → text + bounding boxes
│   ├── pii_detector.py    # PII detection: label proximity + regex patterns
│   ├── masker.py          # PyMuPDF redaction: draws black bars over PII regions
│   └── schemas.py         # Pydantic request/response models
├── Dockerfile
├── docker-compose.yml     # Standalone deployment
├── requirements.txt
└── .env.example
```
