"""
Configuration management for the application.
Loads environment variables and provides centralized settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Gemini API Configuration
    # Use field alias to accept both GEMINI_API_KEY and API_KEY
    gemini_api_key: str
    model_name: str = "gemini-2.5-flash"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"]
    
    @property
    def api_key(self) -> str:
        """Alias for backward compatibility."""
        return self.gemini_api_key

    
    class Config:
        # Look for .env.local in parent directory (project root)
        env_file = str(Path(__file__).parent.parent / ".env.local")
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
try:
    settings = Settings()
except Exception as e:
    print(f"Error loading settings: {e}")
    print("Make sure your .env.local file exists in the project root with API_KEY set")
    raise

