from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=128)
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) == 0:
            raise ValueError("message must not be empty")
        if len(trimmed) > 4000:
            raise ValueError("message exceeds 4000 characters")
        return trimmed

    @field_validator("session_id")
    @classmethod
    def session_id_valid(cls, v: str) -> str:
        if len(v) < 1 or len(v) > 128:
            raise ValueError("session_id must contain 1-128 characters")
        return v


class Metadata(BaseModel):
    resolution_source: str
    model: str
    latency_ms: int
    input_tokens: int
    output_tokens: int
    key_id: Optional[str] = None
    fallback_attempts: int = 0


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    metadata: Metadata


class MessageOut(BaseModel):
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None


class MessagesResponse(BaseModel):
    session_id: str
    messages: List[MessageOut]


class HealthResponse(BaseModel):
    status: str
    keys_configured: int
    cache_enabled: bool
