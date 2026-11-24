import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

from app.config import DATABASE_URL


def _resolve_database_url(url: str) -> str:
    """Ensure directory exists for SQLite database, or fallback if unprivileged."""
    if url.startswith("sqlite:////"):
        db_path = url.replace("sqlite:////", "/")
        parent = os.path.dirname(db_path)
        if parent:
            try:
                os.makedirs(parent, exist_ok=True)
            except (PermissionError, OSError):
                # Unprivileged container without persistent disk mount at /data
                return "sqlite:///./app.db"
    elif url.startswith("sqlite:///"):
        db_path = url.replace("sqlite:///", "")
        parent = os.path.dirname(db_path)
        if parent:
            try:
                os.makedirs(parent, exist_ok=True)
            except (PermissionError, OSError):
                return "sqlite:///./app.db"
    return url


ACTUAL_DATABASE_URL = _resolve_database_url(DATABASE_URL)

engine = create_engine(
    ACTUAL_DATABASE_URL,
    connect_args={"check_same_thread": False} if ACTUAL_DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", Text, nullable=True)
    created_at = Column(String(64), nullable=False)

    __table_args__ = (
        Index("ix_messages_session_created", "session_id", "created_at"),
    )


def create_db_and_tables():
    _resolve_database_url(ACTUAL_DATABASE_URL)
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
