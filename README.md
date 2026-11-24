# Lyftr AI

A resilient, production-ready full-stack AI chat application featuring a FastAPI backend powered by LiteLLM with automatic multi-key failover, in-memory caching, and SQLite session persistence, alongside a responsive React + Vite frontend.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            React + Vite SPA            │
                      │         (Tailwind CSS + Lucide)        │
                      └───────────────────┬────────────────────┘
                                          │ HTTP / JSON
                                          ▼
                      ┌────────────────────────────────────────┐
                      │            FastAPI Backend             │
                      │               (Uvicorn)                │
                      └───────┬───────────┬────────────┬───────┘
                              │           │            │
             ┌────────────────┘           │            └────────────────┐
             ▼                            ▼                             ▼
┌─────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────┐
│     SQLite Database     │  │      LiteLLM Gateway      │  │    In-Memory Cache    │
│  Session & Message Log  │  │  Multi-Key Failover Engine │  │   TTL-Based Response  │
│      (/data/app.db)     │  │ (key_1 -> key_2 -> ... )  │  │        Caching        │
└─────────────────────────┘  └───────────────────────────┘  └───────────────────────┘
```

### Key Capabilities
- **LiteLLM Multi-Key Failover:** Configured with multiple upstream keys (`LLM_API_KEYS=key1,key2`). If key 1 fails (rate limit `429`, server error `500/502/503`), the engine automatically falls back to key 2 without interrupting the user.
- **In-Memory Caching:** LiteLLM TTL-based cache instantly returns identical query results without consuming LLM tokens, reporting `resolution_source: LLM_CACHE` with zero-latency overhead.
- **SQLite Session Persistence:** All conversations are stored with session IDs, roles, content, and execution metadata in SQLite mounted on persistent storage (`/data/app.db`).
- **Resilient Frontend:** Displays live latency, token usage, active key IDs, and resolution sources (`LIVE_INFERENCE` vs `LLM_CACHE`).

---

## Directory Structure

```
lyftr-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── cache_service.py     # LiteLLM caching layer
│   │   ├── config.py            # Environment & app configuration
│   │   ├── database.py          # SQLAlchemy models & SQLite engine
│   │   ├── failover_service.py  # Header-based failure simulation & failover
│   │   ├── llm_service.py       # LiteLLM client & inference orchestration
│   │   ├── main.py              # FastAPI endpoints & CORS
│   │   └── schemas.py           # Pydantic request/response models
│   ├── tests/
│   │   ├── conftest.py          # Pytest fixtures & mock LLM setup
│   │   └── test_main.py         # Full test suite (19 test cases)
│   ├── Dockerfile               # Container configuration for backend
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components (ChatWindow, Sidebar, etc.)
│   │   ├── services/            # Axios API client
│   │   ├── App.jsx              # Application root
│   │   ├── index.css            # Tailwind & theme styling
│   │   └── main.jsx             # React entry point
│   ├── Dockerfile               # Production multi-stage build (Nginx)
│   ├── package.json             # Frontend dependencies
│   ├── vercel.json              # Vercel deployment configuration & SPA routing
│   └── vite.config.js           # Vite build config
├── docker-compose.yml           # Full-stack container orchestration
├── Makefile                     # Developer workflow automation
├── render.yaml                  # Render Blueprint deployment definition
├── .env.example                 # Environment variable templates
└── README.md                    # Project documentation
```

---

## Environment Variables

Copy `.env.example` to `.env` to configure your local or production environment:

| Variable | Description | Default | Example |
|---|---|---|---|
| `LLM_API_KEYS` | Comma-separated LLM provider API keys | *None* | `sk-or-v1-xxx,sk-or-v1-yyy` |
| `DEFAULT_MODEL` | LiteLLM model identifier | `gemini/gemini-2.0-flash` | `gemini/gemini-2.0-flash` |
| `CACHE_ENABLED` | Toggle LiteLLM response caching | `true` | `true` |
| `ENABLE_FAILURE_SIMULATION` | Allow testing key failover via headers | `false` | `true` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:////data/app.db` | `sqlite:////data/app.db` |
| `ALLOWED_ORIGINS` | Permitted CORS origins (comma-separated) | `*` | `https://lyftr-ai.vercel.app` |
| `FRONTEND_ORIGIN` | Single or wildcard origin alias | `*` | `http://localhost:3000` |
| `VITE_API_URL` | Frontend API backend base URL | `http://localhost:8000` | `https://lyftr-ai-backend.onrender.com` |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The interface will be accessible at `http://localhost:3000`.

---

## Running with Docker Compose

To start both services locally with persistent volume storage:
```bash
# Using Makefile
make build
make up

# View logs
make logs

# Stop services
make down
```

Or using Docker Compose directly:
```bash
docker-compose up -d --build
```

---

## Running Tests

The test suite covers endpoints, LiteLLM integration, caching, key failover, session isolation, error handling, and input validation.

```bash
cd backend
pytest -v
```

All 19 test cases run against isolated, in-memory/temporary SQLite fixtures.

---

## API Endpoints

### 1. Health Check
- **`GET /health`**
- Returns server operational state, number of configured API keys, and cache status.
```json
{
  "status": "ok",
  "keys_configured": 2,
  "cache_enabled": true
}
```

### 2. Chat Inference
- **`POST /chat`**
- Optional Header: `X-Simulate-Failure: key_1=429` (when `ENABLE_FAILURE_SIMULATION=true`).
- **Request Body:**
```json
{
  "session_id": "session-abc-123",
  "message": "Explain how caching works.",
  "system_prompt": "You are a helpful software architect."
}
```
- **Response Body:**
```json
{
  "session_id": "session-abc-123",
  "reply": "Caching stores previously computed responses...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 780,
    "input_tokens": 34,
    "output_tokens": 82,
    "key_id": "key_1",
    "fallback_attempts": 0
  }
}
```

### 3. Session History
- **`GET /sessions/{session_id}/messages`**
- Retrieves the full chronologically ordered conversation history for a given session.

---

## Production Deployment

### Backend on Render
1. Create a **Web Service** on [Render](https://dashboard.render.com).
2. Connect your GitHub repository (`lyftr-ai`).
3. Set the configuration:
   - **Root Directory:** `backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Add Persistent Disk (Render Starter plan or higher):
   - **Name:** `lyftr-sqlite-data`
   - **Mount Path:** `/data`
   - **Size:** `1 GB`
5. Configure Environment Variables:
   - `LLM_API_KEYS`: your real API keys (`sk-...,sk-...`)
   - `DEFAULT_MODEL`: `gemini/gemini-2.0-flash`
   - `DATABASE_URL`: `sqlite:////data/app.db`
   - `ALLOWED_ORIGINS`: your Vercel frontend URL (e.g., `https://lyftr-ai.vercel.app`)
   - `CACHE_ENABLED`: `true`
   - `ENABLE_FAILURE_SIMULATION`: `false`

*(Alternatively, use `render.yaml` Blueprint for automated deployment).*

### Frontend on Vercel
1. Import your GitHub repository on [Vercel](https://vercel.com/new).
2. Set the configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variables:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://lyftr-ai-backend.onrender.com`)
4. Deploy!

---

## Deployment Links

- **GitHub Repository:** [https://github.com/CodingWizard34/lyftr-ai](https://github.com/CodingWizard34/lyftr-ai)
- **Production Backend:** [https://lyftr-ai-backend-ae6a.onrender.com](https://lyftr-ai-backend-ae6a.onrender.com)
- **Production Frontend:** *(Deploying on Vercel)*
