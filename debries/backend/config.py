from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = "https://your-project-id.supabase.co"
    SUPABASE_KEY: str = "your-anon-or-service-role-key"
    
    SPACE_TRACK_USERNAME: str = ""
    SPACE_TRACK_PASSWORD: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
