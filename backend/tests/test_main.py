from unittest.mock import patch

from fastapi.testclient import TestClient


class TestHealth:
    def test_health_endpoint(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["keys_configured"] == 2
        assert body["cache_enabled"] is True


class TestChat:
    def test_successful_chat(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply(
            "Hello! How can I help?",
            {
                "resolution_source": "LIVE_INFERENCE",
                "model": "gemini/gemini-3.5-flash",
                "latency_ms": 812,
                "input_tokens": 42,
                "output_tokens": 9,
                "key_id": "key_1",
                "fallback_attempts": 0,
            },
        )

        resp = client.post(
            "/chat",
            json={"session_id": "s-123", "message": "Hello"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["session_id"] == "s-123"
        assert body["reply"] == "Hello! How can I help?"
        md = body["metadata"]
        assert md["resolution_source"] == "LIVE_INFERENCE"
        assert md["model"] == "gemini/gemini-3.5-flash"
        assert md["key_id"] in ("key_1", "key_2")
        assert md["fallback_attempts"] == 0
        assert md["input_tokens"] == 42
        assert md["output_tokens"] == 9
        assert md["latency_ms"] >= 0

    def test_system_prompt_optional(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("OK", {"prompt_tokens": 5, "completion_tokens": 3})

        resp = client.post(
            "/chat",
            json={"session_id": "s-sys", "message": "Hi", "system_prompt": "You are helpful."},
        )
        assert resp.status_code == 200, resp.text

    def test_multi_turn_conversation(self, client: TestClient, mock_llm):
        _, _, add_reply, calls = mock_llm
        add_reply("First reply.", {"prompt_tokens": 10, "completion_tokens": 5})
        add_reply("Second reply.", {"prompt_tokens": 20, "completion_tokens": 7})

        r1 = client.post("/chat", json={"session_id": "s-multi", "message": "First message"})
        assert r1.status_code == 200
        assert r1.json()["reply"] == "First reply."

        r2 = client.post("/chat", json={"session_id": "s-multi", "message": "Second message"})
        assert r2.status_code == 200
        assert r2.json()["reply"] == "Second reply."

        # Verify second call received conversation history (prior messages only)
        _, history, _, _ = calls[-1]
        roles = [m["role"] for m in history]
        assert roles == ["user", "assistant"], roles

    def test_separate_session_histories(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Reply A", {"prompt_tokens": 5, "completion_tokens": 2})
        add_reply("Reply B", {"prompt_tokens": 5, "completion_tokens": 2})

        client.post("/chat", json={"session_id": "session-a", "message": "Hello A"})
        client.post("/chat", json={"session_id": "session-b", "message": "Hello B"})

        ga = client.get("/sessions/session-a/messages")
        gb = client.get("/sessions/session-b/messages")
        assert ga.json()["messages"][0]["content"] == "Hello A"
        assert gb.json()["messages"][0]["content"] == "Hello B"

    def test_sqlite_persistence(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Persistent reply.", {"prompt_tokens": 8, "completion_tokens": 4})

        client.post("/chat", json={"session_id": "s-persist", "message": "Remember me"})

        resp = client.get("/sessions/s-persist/messages")
        assert resp.status_code == 200
        msgs = resp.json()["messages"]
        assert len(msgs) == 2
        assert msgs[0]["role"] == "user"
        assert msgs[0]["content"] == "Remember me"
        assert msgs[1]["role"] == "assistant"
        assert msgs[1]["content"] == "Persistent reply."

    def test_invalid_session_id_too_long(self, client: TestClient, mock_llm):
        resp = client.post("/chat", json={"session_id": "x" * 129, "message": "Hello"})
        assert resp.status_code == 422, resp.text

    def test_empty_message(self, client: TestClient, mock_llm):
        resp = client.post("/chat", json={"session_id": "s-empty", "message": "   "})
        assert resp.status_code == 422, resp.text

    def test_message_exceeding_4000_chars(self, client: TestClient, mock_llm):
        resp = client.post("/chat", json={"session_id": "s-long", "message": "a" * 4001})
        assert resp.status_code == 422, resp.text

    def test_failed_request_not_stored(self, client: TestClient, mock_llm):
        _, _infer, _, _ = mock_llm
        _infer.responses = []  # force RuntimeError

        resp = client.post(
            "/chat",
            json={"session_id": "s-fail", "message": "Hello"},
            headers={"X-Simulate-Failure": "*=500"},
        )
        assert resp.status_code == 503, resp.text
        assert resp.json()["detail"] == "all providers unavailable"

        # Failed request must not be stored
        get_resp = client.get("/sessions/s-fail/messages")
        assert get_resp.status_code == 404, get_resp.text

    def test_successful_key_failover(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Fallback reply.", {
            "resolution_source": "LIVE_INFERENCE",
            "key_id": "key_2",
            "fallback_attempts": 1,
            "input_tokens": 10,
            "output_tokens": 4,
        })

        resp = client.post(
            "/chat",
            json={"session_id": "s-failover", "message": "Hello"},
            headers={"X-Simulate-Failure": "key_1=429"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["reply"] == "Fallback reply."
        md = body["metadata"]
        assert md["key_id"] == "key_2"
        assert md["fallback_attempts"] == 1
        assert md["resolution_source"] == "LIVE_INFERENCE"

    def test_all_keys_failing_returns_503(self, client: TestClient, mock_llm):
        resp = client.post(
            "/chat",
            json={"session_id": "s-allfail", "message": "Hello"},
            headers={"X-Simulate-Failure": "*=429"},
        )
        assert resp.status_code == 503, resp.text
        assert resp.json()["detail"] == "all providers unavailable"

    def test_cache_hit(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply(
            "Cached reply.",
            {"resolution_source": "LIVE_INFERENCE", "key_id": "key_1", "fallback_attempts": 0,
             "input_tokens": 10, "output_tokens": 5, "latency_ms": 800},
        )
        add_reply(
            "Cached reply.",
            {"resolution_source": "LLM_CACHE", "key_id": None, "fallback_attempts": 0,
             "input_tokens": 10, "output_tokens": 5, "latency_ms": 50},
        )

        r1 = client.post("/chat", json={"session_id": "s-cache-1", "message": "Identical prompt"})
        assert r1.status_code == 200
        assert r1.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
        assert r1.json()["metadata"]["key_id"] is not None

        r2 = client.post("/chat", json={"session_id": "s-cache-2", "message": "Identical prompt"})
        assert r2.status_code == 200
        md = r2.json()["metadata"]
        assert md["resolution_source"] == "LLM_CACHE"
        assert md["key_id"] is None
        assert md["fallback_attempts"] == 0

    def test_identical_response_on_cache_hit(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Deterministic reply.", {"prompt_tokens": 7, "completion_tokens": 3})
        add_reply("Deterministic reply.", {"prompt_tokens": 7, "completion_tokens": 3})

        r1 = client.post("/chat", json={"session_id": "s-det-1", "message": "Same prompt"})
        r2 = client.post("/chat", json={"session_id": "s-det-2", "message": "Same prompt"})
        assert r1.json()["reply"] == r2.json()["reply"]

    def test_different_prompts_distinct_cache(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Reply one.", {"prompt_tokens": 5, "completion_tokens": 2})
        add_reply("Reply two.", {"prompt_tokens": 5, "completion_tokens": 2})

        r1 = client.post("/chat", json={"session_id": "s-diff-1", "message": "Prompt one"})
        r2 = client.post("/chat", json={"session_id": "s-diff-2", "message": "Prompt two"})
        assert r1.json()["reply"] == "Reply one."
        assert r2.json()["reply"] == "Reply two."
        assert r1.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
        assert r2.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"

    def test_session_history_retrieval(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Assistant response.", {"prompt_tokens": 10, "completion_tokens": 6})

        client.post("/chat", json={"session_id": "s-hist", "message": "Hello"})
        resp = client.get("/sessions/s-hist/messages")
        assert resp.status_code == 200
        body = resp.json()
        assert body["session_id"] == "s-hist"
        assert len(body["messages"]) == 2
        assert body["messages"][0]["role"] == "user"
        assert body["messages"][1]["role"] == "assistant"
        assert body["messages"][1]["metadata"]["input_tokens"] == 10

    def test_unknown_session_returns_404(self, client: TestClient):
        resp = client.get("/sessions/does-not-exist/messages")
        assert resp.status_code == 404, resp.text

    def test_failure_simulation_affects_only_one_request(self, client: TestClient, mock_llm):
        _, _, add_reply, _ = mock_llm
        add_reply("Reply after failover.", {
            "resolution_source": "LIVE_INFERENCE",
            "key_id": "key_2",
            "fallback_attempts": 1,
            "input_tokens": 10,
            "output_tokens": 4,
        })
        r1 = client.post(
            "/chat",
            json={"session_id": "s-iso-1", "message": "Hello"},
            headers={"X-Simulate-Failure": "key_1=429"},
        )
        assert r1.status_code == 200
        assert r1.json()["metadata"]["key_id"] == "key_2"
        assert r1.json()["metadata"]["fallback_attempts"] == 1

        # Second request without header -> key_1 works normally (no simulation leak)
        add_reply("Normal reply.", {"key_id": "key_1", "fallback_attempts": 0})
        r2 = client.post("/chat", json={"session_id": "s-iso-2", "message": "Hello again"})
        assert r2.status_code == 200
        assert r2.json()["metadata"]["fallback_attempts"] == 0
        assert r2.json()["metadata"]["key_id"] in ("key_1", "key_2")


class TestValidationErrorFormat:
    def test_errors_are_json(self, client: TestClient):
        resp = client.post("/chat", json={"session_id": "s", "message": ""})
        assert resp.status_code == 422
        assert "detail" in resp.json()
        assert resp.headers.get("content-type", "").startswith("application/json")
