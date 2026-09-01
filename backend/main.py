"""PhishYou — backend for the first real AI integration.

Scope: prove the platform can reach a configured LLM provider — configure,
test the connection with a real round-trip, and exchange chat messages.
Nothing else lives here yet (campaign orchestration is out of scope).

Endpoints (naming follows the repo-wide /api/v1 convention):
  GET  /api/v1/ai/status          masked configuration + connection state
  PUT  /api/v1/ai/config         save provider settings (key is write-only)
  POST /api/v1/ai/test-connection REAL provider round-trip
  POST /api/v1/ai/chat           real chat completion for {role, content}[]

The browser never sees the API key: /status returns only a masked hint,
/config accepts the key write-only, and provider errors are sanitized in
backend/providers.py before they reach a response.

Run (development):
  cd backend
  python -m venv .venv
  .venv\\Scripts\\pip install -r requirements.txt          (Windows)
  .venv\\Scripts\\python -m uvicorn main:app --reload --port 8000

In production the app also serves ../frontend/dist (vite build output)
so one origin hosts both the SPA and the API.
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from config import ConfigError, ConfigStore
from providers import ChatMessage, ProviderError, build_provider

app = FastAPI(
    title="PhishYou API",
    version="0.1.0",
    description="AI integration slice — provider configuration, connection test and chat.",
)

# Development convenience: the vite dev server proxies /api to this origin,
# so CORS only matters when the SPA is served from elsewhere.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

store = ConfigStore()

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


# ----------------------------------------------------------------------
# Request models
# ----------------------------------------------------------------------

class ConfigIn(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None


class ChatMessageIn(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatIn(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=60)


# ----------------------------------------------------------------------
# AI integration endpoints
# ----------------------------------------------------------------------

@app.get("/api/v1/ai/status")
async def ai_status() -> dict:
    """Browser-safe configuration + connection state (no credentials)."""
    return store.status_payload()


@app.put("/api/v1/ai/config")
async def save_ai_config(payload: ConfigIn) -> dict:
    """Persist provider settings server-side. The API key is write-only."""
    try:
        store.save(
            provider=payload.provider,
            model=payload.model,
            api_key=payload.api_key,
            base_url=payload.base_url,
        )
    except ConfigError as exc:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=400)
    return {"success": True, "status": store.status_payload()}


@app.post("/api/v1/ai/test-connection")
async def test_ai_connection() -> dict:
    """REAL round-trip to the provider — never a config-fields-only check."""
    try:
        provider = build_provider(store.effective())
    except ProviderError as exc:
        return {
            "success": False,
            "status": "not_configured",
            "error": exc.message,
            "errorKind": exc.kind,
        }

    try:
        result = await provider.test_connection()
    except ProviderError as exc:
        store.record_result(False, exc.message)
        return {
            "success": False,
            "status": "error",
            "error": exc.message,
            "errorKind": exc.kind,
        }
    store.record_result(True)
    return {
        "success": True,
        "status": "connected",
        "latencyMs": result["latency_ms"],
        "model": result["model"],
    }


@app.post("/api/v1/ai/chat")
async def ai_chat(payload: ChatIn) -> dict:
    """Real chat completion through the configured provider."""
    try:
        provider = build_provider(store.effective())
    except ProviderError as exc:
        return {"success": False, "error": exc.message, "errorKind": exc.kind}

    messages = [ChatMessage(role=m.role, content=m.content) for m in payload.messages]
    try:
        reply = await provider.chat(messages)
    except ProviderError as exc:
        store.record_result(False, exc.message)
        return {"success": False, "error": exc.message, "errorKind": exc.kind}
    store.record_result(True)
    return {"success": True, "message": {"role": "assistant", "content": reply}, "model": provider.model}


# ----------------------------------------------------------------------
# Static SPA serving (frontend/dist when it exists)
# ----------------------------------------------------------------------

if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False, response_model=None)
async def spa_fallback(full_path: str) -> FileResponse | JSONResponse:
    if full_path.startswith("api/"):
        return JSONResponse({"success": False, "error": "Not found"}, status_code=404)
    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index)
    return JSONResponse(
        {
            "service": "phishyou-backend",
            "status": "ok",
            "hint": "Frontend build not found — run `npm run build` in frontend/ or use the vite dev server.",
        }
    )
