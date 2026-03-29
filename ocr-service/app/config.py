from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OCR_SERVICE_API_KEY: str = ""
    OCR_LANGUAGES: list[str] = ["en"]
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TIMEOUT: int = 60
    MAX_PDF_SIZE_MB: int = 20
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env"}


settings = Settings()
