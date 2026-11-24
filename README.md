# Lyftr AI — LLM Chatbot with Key Failover & Response Caching

A production-grade, resilient full-stack AI application featuring a FastAPI backend powered by LiteLLM with multi-key failover, in-memory caching, SQLite persistence, and a modern React + Vite frontend.

---

## 1. Live URLs

- **Production Frontend:** [https://lyftr-ai-mocha.vercel.app](https://lyftr-ai-mocha.vercel.app)
- **Production Backend:** [https://lyftr-ai-backend-ae6a.onrender.com](https://lyftr-ai-backend-ae6a.onrender.com)
- **Backend Health Check:** [https://lyftr-ai-backend-ae6a.onrender.com/health](https://lyftr-ai-backend-ae6a.onrender.com/health)
- **GitHub Repository:** [https://github.com/CodingWizard34/lyftr-ai](https://github.com/CodingWizard34/lyftr-ai)
- **Demo Video:** [Watch 2-3 Minute Walkthrough](https://youtu.be/placeholder) *(2–3 minute video demonstrating live app, cache hits, token tracking, and failover with `X-Simulate-Failure`)*

---

## 2. Run locally: with Docker and without

### Option A: With Docker (Recommended)

The entire stack starts with a single command via the included `Makefile`:

```bash
# 1. Clone the repository
git clone https://github.com/CodingWizard34/lyftr-ai.git
cd lyftr-ai

# 2. Copy the environment template and configure your keys
cp .env.example .env

# 3. Start the entire stack
make up
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:8000](http://localhost:8000)
- **Health Check:** `curl http://localhost:8000/health`

To view logs or stop the stack:
```bash
make logs    # Follow container logs
make down    # Gracefully stop containers
```

---

### Option B: Without Docker (Local Development)

#### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run test suite (19 tests, 100% pass)
pytest -v

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Design decisions: key fallback, caching, SQLite session storage

### Key Fallback Architecture
- **Multi-Key Resilience:** Configured via `LLM_API_KEYS=key1,key2,...`. Keys are indexed to stable identifiers (`key_1`, `key_2`, ...).
- **Graceful Failure Handling:** If a key encounters rate limits (`429`), quota exhaustion, or server errors (`500`, `502`, `503`), the inference engine catches the exception and immediately attempts inference with the next key in the pool.
- **Failover Accounting:** Each response includes `fallback_attempts`, indicating how many keys failed before succeeding.
- **Clean Exhaustion Handling:** If every key in the pool fails, the service returns a clean HTTP 503 `{"detail": "all providers unavailable"}` without exposing stack traces or crashing the application.
- **On-Demand Simulation:** When `ENABLE_FAILURE_SIMULATION=true`, the `X-Simulate-Failure` request header allows injecting simulated failures per key (e.g. `key_1=429` or `*=429`) without burning real quotas.

### Response Caching Strategy
- **LiteLLM Built-in Cache:** Uses LiteLLM's in-memory caching layer (`caching=True`, TTL configurable via `LITELLM_CACHE_TTL`).
- **Deterministic Cache Key:** The cache key is derived from the model plus the complete message list sent to the LLM (`system_prompt + history + user_message`).
- **Cache Hit Contract:** When a cached response is served, `resolution_source` is set to `LLM_CACHE`, `key_id` is set to `null`, `fallback_attempts` is `0`, and latency is near-zero (< 5ms). Fresh inference reports `LIVE_INFERENCE` with the responding `key_id`.

### SQLite Session Storage
- **Pure SQLite Architecture:** No external dependencies like PostgreSQL or Redis. Session history is stored locally in SQLite.
- **Container Persistence:** Designed to store the database under `/data/app.db` via a named Docker volume (`sqlite_data:/data`) so history survives container rebuilds. Includes a fallback mechanism for restricted non-root environments.
- **Per-Session State:** Conversations are segregated by `session_id`. Messages are strictly ordered by `created_at` (ISO-8601 server timestamp).
- **Failure Isolation:** Any request resulting in a validation failure (`422`) or provider error (`503`) is discarded and never committed to the database.

---

## 4. Verification: how to see failover, cache hits and per-message token usage

### 1. Health Check
```bash
curl -X GET "https://lyftr-ai-backend-ae6a.onrender.com/health"
```
**Expected Response:**
```json
{
  "status": "ok",
  "keys_configured": 2,
  "cache_enabled": true
}
```

---

### 2. Live Inference & Per-Request Token Usage
Send a unique prompt in a new session:
```bash
curl -X POST "https://lyftr-ai-backend-ae6a.onrender.com/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "message": "Explain quantum computing in 10 words"
  }'
```
**Expected Response (`200 OK`):**
```json
{
  "session_id": "test-session-001",
  "reply": "Computers using quantum states to solve complex problems very quickly.",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-3.5-flash",
    "latency_ms": 1250,
    "input_tokens": 16,
    "output_tokens": 12,
    "key_id": "key_1",
    "fallback_attempts": 0
  }
}
```
*Note: `input_tokens` and `output_tokens` reflect usage for this request only, never a running total.*

---

### 3. Response Cache Hit
Send the exact same request again:
```bash
curl -X POST "https://lyftr-ai-backend-ae6a.onrender.com/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "message": "Explain quantum computing in 10 words"
  }'
```
**Expected Response (`200 OK`):**
```json
{
  "session_id": "test-session-001",
  "reply": "Computers using quantum states to solve complex problems very quickly.",
  "metadata": {
    "resolution_source": "LLM_CACHE",
    "model": "gemini/gemini-3.5-flash",
    "latency_ms": 2,
    "input_tokens": 16,
    "output_tokens": 12,
    "key_id": null,
    "fallback_attempts": 0
  }
}
```
*Notice: `resolution_source: LLM_CACHE`, `key_id: null`, `fallback_attempts: 0`, and latency is under 5 ms.*

---

### 4. Automatic Key Failover (Simulated)
Simulate a rate-limit error (`429`) on `key_1`:
```bash
curl -X POST "https://lyftr-ai-backend-ae6a.onrender.com/chat" \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: key_1=429" \
  -d '{
    "session_id": "test-session-failover",
    "message": "What is 2 + 2?"
  }'
```
**Expected Response (`200 OK`):**
```json
{
  "session_id": "test-session-failover",
  "reply": "2 + 2 = 4.",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-3.5-flash",
    "latency_ms": 1100,
    "input_tokens": 12,
    "output_tokens": 7,
    "key_id": "key_2",
    "fallback_attempts": 1
  }
}
```
*Notice: `key_id: key_2` took over automatically, with `fallback_attempts: 1`.*

Simulate all keys failing:
```bash
curl -X POST "https://lyftr-ai-backend-ae6a.onrender.com/chat" \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: *=429" \
  -d '{
    "session_id": "test-session-failover",
    "message": "This request should fail"
  }'
```
**Expected Response (`503 Service Unavailable`):**
```json
{
  "detail": "all providers unavailable"
}
```

---

### 5. Session History Retrieval
```bash
curl -X GET "https://lyftr-ai-backend-ae6a.onrender.com/sessions/test-session-001/messages"
```
**Expected Response (`200 OK`):**
```json
{
  "session_id": "test-session-001",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing in 10 words"
    },
    {
      "role": "assistant",
      "content": "Computers using quantum states to solve complex problems very quickly.",
      "metadata": {
        "resolution_source": "LIVE_INFERENCE",
        "input_tokens": 16,
        "output_tokens": 12
      }
    }
  ]
}
```

---

## 5. Setup Used: your editor and AI tools

- **Operating System:** Windows 11 / Linux (container runtime)
- **Editor:** Visual Studio Code & PowerShell
- **Backend Stack:** Python 3.11, FastAPI, Uvicorn, LiteLLM, SQLAlchemy, SQLite, Pydantic v2
- **Frontend Stack:** React 18, Vite, Tailwind CSS, Lucide React, Axios, React Markdown
- **Containerization:** Docker & Docker Compose (multi-stage builds)
- **Deployment:** Render (Free Web Service) for Backend, Vercel for Frontend
- **AI Tools & Assistants:** Google Antigravity Agent, Gemini API Studio

---

## 6. Bonus features (if any): what you added beyond the requirements and why

1. **Dynamic Model Selection:**
   - In addition to the default model, the UI header allows switching between active Gemini models (`gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-pro-latest`) dynamically per request.
2. **Interactive UI & Starter Prompts:**
   - Welcome screen with clickable prompt chips and feature cards that automatically prefill and send queries for instant testing.
3. **In-UI Failover Simulation Toggle:**
   - A dedicated Settings modal allows enabling `X-Simulate-Failure: key_1=429` directly from the web interface to visually verify failover without using terminal cURL commands.
4. **Session History Viewer & Reset:**
   - Users can review prior session turns via an in-app history viewer modal and start a fresh session at any time with the "New Chat" button.
5. **Resilient Database Fallback:**
   - The SQLite storage layer automatically detects read-only file systems (such as Render Free Tier root) and seamlessly falls back to a safe local working directory without throwing unhandled `PermissionError`.
6. **Full Accessibility & Contract Testing (`data-testid`):**
   - Implemented 100% of the specified `data-testid` contracts (`chat-input`, `send-button`, `assistant-message`, `meta-source`, `meta-model`, `meta-latency`, `meta-input-tokens`, `meta-output-tokens`, `system-prompt-input`) to support automated grading and end-to-end integration tests.
