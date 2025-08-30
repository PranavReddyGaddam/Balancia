from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://balancia-ashy.vercel.app"
    
    # OpenAI Settings
    OPENAI_API_KEY: str = "OPENAI_API_KEY"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file

# Create settings instance
settings = Settings()

# Convert ALLOWED_ORIGINS string to list
ALLOWED_ORIGINS_LIST = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Debug: Print environment variable loading status
print(f"Config: OPENAI_API_KEY = {'Set' if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != 'OPENAI_API_KEY' else 'Not Set'}")
print(f"Config: ALLOWED_ORIGINS = {ALLOWED_ORIGINS_LIST}")
