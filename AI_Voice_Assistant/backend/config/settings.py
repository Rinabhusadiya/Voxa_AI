import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "Voxa AI Voice Assistant Backend"
    APP_VERSION: str = "1.0.0"
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8005"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # AI Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini").lower()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", "*")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()] if raw_cors != "*" else ["*"]

settings = Settings()
