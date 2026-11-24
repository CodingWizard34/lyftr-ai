import os
import sys
import tempfile
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure backend/app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Create a guaranteed-writable temp SQLite database file
_fd, _TEST_DB = tempfile.mkstemp(suffix=".db", prefix="lyftr_test_")
os.close(_fd)
_db_path = _TEST_DB.replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["LLM_API_KEYS"] = "test-key-1,test-key-2"
os.environ["DEFAULT_MODEL"] = "gemini/gemini-3.5-flash"
os.environ["CACHE_ENABLED"] = "true"
os.environ["ENABLE_FAILURE_SIMULATION"] = "true"
os.environ["FRONTEND_ORIGIN"] = "*"

# Remove any cached app import
for mod in list(sys.modules.keys()):
    if mod.startswith("app"):
        del sys.modules[mod]

from app.main import app  # noqa: E402
from app.database import create_db_and_tables, engine  # noqa: E402


def _make_response(content, usage=None, cache_hit=False, latency_ms=100):
    """Build a fake LiteLLM completion response."""
    resp = MagicMock()
    resp.choices = [MagicMock()]
    resp.choices[0].message.content = content
    resp.choices[0].message.role = "assistant"
    resp.usage = usage or {"prompt_tokens": 10, "completion_tokens": 9}
    resp._cache_hit = cache_hit
    resp.cache_hit = cache_hit
    resp._response_ms = latency_ms
    return resp


@pytest.fixture
def client():
    # Clean test DB between tests (ignore lock errors on Windows)
    try:
        if os.path.exists(_TEST_DB):
            os.remove(_TEST_DB)
    except PermissionError:
        pass
    create_db_and_tables()
    client = TestClient(app)
    yield client
    # Release SQLite file lock for the next test
    engine.dispose()
    try:
        if os.path.exists(_TEST_DB):
            os.remove(_TEST_DB)
    except PermissionError:
        pass


@pytest.fixture
def mock_llm():
    """Mock llm_service.infer to return canned (reply, metadata) tuples."""
    calls = []  # list of (system_prompt, history, user_message, simulate_header)

    def _infer(system_prompt, history, user_message, simulate_header=None, model=None, **kwargs):
        calls.append((system_prompt, history, user_message, simulate_header))
        if not _infer.responses:
            raise RuntimeError("all providers unavailable")
        reply, metadata = _infer.responses.pop(0)
        return reply, metadata

    _infer.responses = []

    def add_reply(reply, metadata=None):
        default = {
            "resolution_source": "LIVE_INFERENCE",
            "model": "gemini/gemini-3.5-flash",
            "latency_ms": 100,
            "input_tokens": 10,
            "output_tokens": 9,
            "key_id": "key_1",
            "fallback_attempts": 0,
        }
        if metadata is not None:
            default.update(metadata)
        _infer.responses.append((reply, default))

    with patch("app.main.llm_service.infer", side_effect=_infer) as m:
        yield m, _infer, add_reply, calls
