import os
from dotenv import load_dotenv

load_dotenv()

# LiteLLM / provider configuration
LLM_API_KEYS = [k.strip().strip('"').strip("'") for k in os.getenv("LLM_API_KEYS", "").split(",") if k.strip()]
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemini/gemini-3.5-flash-lite")

# Map keys to stable key IDs
def _key_id(key: str) -> str:
    idx = LLM_API_KEYS.index(key) + 1
    return f"key_{idx}"

KEY_IDS = [_key_id(k) for k in LLM_API_KEYS]

# Caching
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"
LITELLM_CACHE_TYPE = os.getenv("LITELLM_CACHE_TYPE", "in-memory")
LITELLM_CACHE_TTL = int(os.getenv("LITELLM_CACHE_TTL", "3600"))

# Failure simulation
ENABLE_FAILURE_SIMULATION = os.getenv("ENABLE_FAILURE_SIMULATION", "false").lower() == "true"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////data/app.db")

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_ORIGIN", "*")
FRONTEND_ORIGIN = ALLOWED_ORIGINS

# Request limits
MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "4000"))
MAX_SESSION_ID_LENGTH = int(os.getenv("MAX_SESSION_ID_LENGTH", "128"))
DEFAULT_TIMEOUT = int(os.getenv("DEFAULT_TIMEOUT", "60"))
