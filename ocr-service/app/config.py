from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OCR_SERVICE_API_KEY: str = ""
    OCR_LANGUAGES: list[str] = ["en", "ar"]
    MAX_PDF_SIZE_MB: int = 20
    LOG_LEVEL: str = "INFO"

    # PII detection keywords — labels that appear next to sensitive values
    PII_LABELS: list[str] = [
        "customer",
        "client name",
        "full name",
        "insured name",
        "name of insured",
        "policyholder",
        "email",
        "email address",
        "e-mail",
        "mobile",
        "mobile number",
        "phone",
        "contact number",
        "tel",
        "chassis",
        "chassis no",
        "vin",
        "registration",
        "reg no",
        "plate",
        "plate no",
        "vehicle no",
        "tc no",
        "traffic file",
    ]

    model_config = {"env_file": ".env"}


settings = Settings()
