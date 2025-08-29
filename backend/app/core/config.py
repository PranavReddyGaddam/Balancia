from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://balancia-ashy.vercel.app"
    
    # Amazon Textract Settings
    AWS_ACCESS_KEY_ID: str = "AWS_ACCESS_KEY_ID"
    AWS_SECRET_ACCESS_KEY: str = "AWS_SECRET_ACCESS_KEY"
    AWS_REGION: str = "us-east-1"
    
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
print(f"Config: AWS_ACCESS_KEY_ID = {'Set' if settings.AWS_ACCESS_KEY_ID else 'Not Set'}")
print(f"Config: AWS_SECRET_ACCESS_KEY = {'Set' if settings.AWS_SECRET_ACCESS_KEY else 'Not Set'}")
print(f"Config: ALLOWED_ORIGINS = {ALLOWED_ORIGINS_LIST}")
