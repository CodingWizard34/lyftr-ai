"""Cache helpers around LiteLLM's built-in caching.

LiteLLM handles caching automatically when `caching=True` is passed to
`completion()`. This module exposes helpers used by the service layer to
configure and introspect the cache.
"""

import hashlib
import json
from typing import List, Dict, Any, Optional

import litellm

from app.config import CACHE_ENABLED, LITELLM_CACHE_TYPE, LITELLM_CACHE_TTL


def configure_cache() -> None:
    if not CACHE_ENABLED:
        litellm.cache = None
        return
    litellm.cache = litellm.Cache(
        type=LITELLM_CACHE_TYPE,
        ttl=LITELLM_CACHE_TTL,
    )


def cache_key_for_messages(model: str, messages: List[Dict[str, str]]) -> str:
    """Deterministic cache key derived from model and the full message list."""
    payload = {"model": model, "messages": messages}
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def is_cache_enabled() -> bool:
    return CACHE_ENABLED and litellm.cache is not None
