from supabase import create_client, Client
from config import settings

# Initialize the Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_db() -> Client:
    """Dependency injection to get the Supabase client."""
    return supabase
