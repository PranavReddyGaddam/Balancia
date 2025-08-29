from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Smart Split API"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # OCR Settings
    TESSERACT_CMD: str = "tesseract"
    OCR_LANGUAGE: str = "eng"
    
    # OpenRouter Settings
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "qwen/qwen3-32b"
    OPENROUTER_MAX_TOKENS: int = 12000
    
    # Amazon Textract Settings
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    
    # Default Tax and Tip Rates
    DEFAULT_TAX_RATE: float = 0.08
    DEFAULT_TIP_RATE: float = 0.18
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Debug: Print environment variable loading status
print(f"🔍 Config: AWS_ACCESS_KEY_ID = {'Set' if settings.AWS_ACCESS_KEY_ID else 'Not Set'}")
print(f"🔍 Config: AWS_SECRET_ACCESS_KEY = {'Set' if settings.AWS_SECRET_ACCESS_KEY else 'Not Set'}")
print(f"🔍 Config: OPENROUTER_API_KEY = {'Set' if settings.OPENROUTER_API_KEY else 'Not Set'}")

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
