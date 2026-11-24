import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import (
    LLM_API_KEYS,
    KEY_IDS,
    CACHE_ENABLED,
    DATABASE_URL,
    ALLOWED_ORIGINS,
    FRONTEND_ORIGIN,
)
from app.database import create_db_and_tables, get_db, Message as MessageModel
from app.schemas import (
    ChatRequest,
    ChatResponse,
    Metadata,
    MessageOut,
    MessagesResponse,
    HealthResponse,
)
from app.llm_service import LLMService

app = FastAPI(title="Lyftr AI", version="1.0.0")

_origins = [o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()]
_cors_origins = ["*"] if not _origins or "*" in _origins else _origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = LLMService()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid input"})


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        keys_configured=len(LLM_API_KEYS),
        cache_enabled=CACHE_ENABLED,
    )


@app.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    x_simulate_failure: Optional[str] = Header(None, alias="X-Simulate-Failure"),
):
    with get_db() as db:
        # Load prior conversation history (oldest first)
        rows = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == request.session_id)
            .order_by(MessageModel.created_at.asc(), MessageModel.id.asc())
            .all()
        )

    # Keep last 6 conversation turns and cap assistant history entries to 400 chars so upstream Google API never triggers free-tier 503 load-shedding
    MAX_HISTORY_MESSAGES = 6
    MAX_ASSISTANT_HISTORY_CHARS = 400

    recent_rows = rows[-MAX_HISTORY_MESSAGES:] if len(rows) > MAX_HISTORY_MESSAGES else rows
    history = []
    for r in recent_rows:
        content = r.content
        if r.role == "assistant" and len(content) > MAX_ASSISTANT_HISTORY_CHARS:
            content = content[:MAX_ASSISTANT_HISTORY_CHARS] + "..."
        history.append({"role": r.role, "content": content})

    try:
        reply, metadata = llm_service.infer(
            system_prompt=request.system_prompt,
            history=history,
            user_message=request.message,
            simulate_header=x_simulate_failure,
            model=request.model,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="all providers unavailable")

    now = datetime.now(timezone.utc).isoformat()

    # Persist user and assistant messages only after successful inference
    with get_db() as db:
        db.add(
            MessageModel(
                session_id=request.session_id,
                role="user",
                content=request.message,
                created_at=now,
            )
        )
        db.add(
            MessageModel(
                session_id=request.session_id,
                role="assistant",
                content=reply,
                metadata_=json_dumps(metadata),
                created_at=now,
            )
        )
        db.commit()

    return ChatResponse(
        session_id=request.session_id,
        reply=reply,
        metadata=Metadata(**metadata),
    )


@app.get("/sessions/{session_id}/messages", response_model=MessagesResponse)
def get_messages(session_id: str):
    with get_db() as db:
        exists = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == session_id)
            .first()
        )
        if not exists:
            raise HTTPException(status_code=404, detail="session not found")

        rows = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == session_id)
            .order_by(MessageModel.created_at.asc(), MessageModel.id.asc())
            .all()
        )

    messages: List[MessageOut] = []
    for r in rows:
        meta = None
        if r.metadata_:
            try:
                meta = json_loads(r.metadata_)
            except Exception:
                meta = None
        messages.append(
            MessageOut(role=r.role, content=r.content, metadata=meta)
        )

    return MessagesResponse(session_id=session_id, messages=messages)


def json_dumps(obj: Any) -> str:
    import json
    return json.dumps(obj)


def json_loads(s: str) -> Any:
    import json
    return json.loads(s)
