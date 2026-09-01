"""PhishYou backend — AI provider configuration.

Effective configuration = environment defaults (LLM_* variables, optionally
loaded from backend/.env) overlaid by anything saved through the console
UI. UI saves persist to backend/ai_config.json — a server-side file that is
git-ignored and never returned to the browser; the status endpoint only
reports a masked key hint.

Environment variables (see backend/.env.example):
  LLM_PROVIDER       provider id — "openrouter" (default) or "qwen"
  OPENROUTER_API_KEY OpenRouter API key (LLM_API_KEY is the generic fallback)
  LLM_API_KEY        generic provider API key (QWEN_API_KEY is a qwen alias)
  LLM_MODEL          default chat model id
  LLM_BASE_URL       provider REST base URL
"""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import dotenv_values

BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"
CONFIG_FILE = BACKEND_DIR / "ai_config.json"

PROVIDER_LABELS = {
    "openrouter": "OpenRouter",
    "qwen": "Alibaba Cloud Qwen (DashScope)",
}
DEFAULT_PROVIDER = "openrouter"
# Per-provider fallbacks used when LLM_MODEL / LLM_BASE_URL are not set.
PROVIDER_DEFAULTS: dict[str, dict[str, str]] = {
    "openrouter": {
        "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "base_url": "https://openrouter.ai/api/v1",
    },
    "qwen": {
        "model": "qwen-plus",
        "base_url": "https://dashscope.aliyuncs.com/api/v1",
    },
}


class ConfigError(ValueError):
    """Raised when a configuration save request is invalid."""


def mask_key(key: str) -> str:
    """Masked hint for a secret — enough to recognize, never to use."""
    if len(key) <= 8:
        return "••••••••"
    return f"{key[:3]}••••{key[-4:]}"


def _env_defaults() -> dict[str, str]:
    """LLM_* defaults — process environment wins over the .env file."""
    file_values = dotenv_values(ENV_FILE)

    def read(*names: str) -> str | None:
        for name in names:
            value = os.environ.get(name) or file_values.get(name)
            if value and value.strip():
                return value.strip()
        return None

    provider = read("LLM_PROVIDER") or DEFAULT_PROVIDER
    fallbacks = PROVIDER_DEFAULTS.get(provider, PROVIDER_DEFAULTS[DEFAULT_PROVIDER])
    if provider == "qwen":
        api_key = read("LLM_API_KEY", "QWEN_API_KEY")
    else:  # openrouter — dedicated variable first, generic fallback second
        api_key = read("OPENROUTER_API_KEY", "LLM_API_KEY")
    return {
        "provider": provider,
        "api_key": api_key or "",
        "model": read("LLM_MODEL") or fallbacks["model"],
        "base_url": read("LLM_BASE_URL") or fallbacks["base_url"],
    }


class ConfigStore:
    """Thread-safe store merging env defaults with UI-saved overrides."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._saved = self._load_saved()

    # -- persistence ------------------------------------------------------

    def _load_saved(self) -> dict[str, Any]:
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except (OSError, json.JSONDecodeError):
            pass
        return {}

    def _persist(self) -> None:
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as fh:
                json.dump(self._saved, fh, indent=2)
            try:
                os.chmod(CONFIG_FILE, 0o600)  # best effort — POSIX
            except OSError:
                pass
        except OSError:
            # Non-fatal: in-memory config still serves this process.
            pass

    # -- reads ------------------------------------------------------------

    def effective(self) -> dict[str, Any]:
        """Merged view: env defaults + UI-saved overrides + connection state."""
        with self._lock:
            merged: dict[str, Any] = dict(_env_defaults())
            for field in ("provider", "model", "api_key", "base_url"):
                value = self._saved.get(field)
                if value:  # saved values override env defaults
                    merged[field] = value
            merged["state"] = self._saved.get("state") or {}
            return merged

    def status_payload(self) -> dict[str, Any]:
        """Browser-safe view of the configuration — never the raw key."""
        cfg = self.effective()
        state = cfg["state"]
        if not cfg["api_key"]:
            status = "not_configured"
        elif state.get("last_status") == "connected":
            status = "connected"
        elif state.get("last_status") == "error":
            status = "error"
        else:
            status = "configured"
        return {
            "status": status,
            "provider": cfg["provider"],
            "providerLabel": PROVIDER_LABELS.get(cfg["provider"], cfg["provider"]),
            "model": cfg["model"],
            "apiKeySet": bool(cfg["api_key"]),
            "apiKeyHint": mask_key(cfg["api_key"]) if cfg["api_key"] else None,
            "baseUrl": cfg["base_url"],
            "lastTestedAt": state.get("last_tested_at"),
            "lastError": state.get("last_error"),
        }

    # -- writes -----------------------------------------------------------

    def save(
        self,
        provider: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> None:
        """Persist a UI configuration save (API key is write-only)."""
        if provider is not None and provider != "":
            provider = provider.strip()
            if provider not in PROVIDER_LABELS:
                raise ConfigError(
                    f"Unsupported provider “{provider}”. Supported: {', '.join(sorted(PROVIDER_LABELS))}."
                )
        if model is not None and model != "":
            model = model.strip()
            if not model:
                raise ConfigError("Model id cannot be empty.")
        if base_url is not None and base_url != "":
            base_url = base_url.strip()
            if not base_url.startswith(("http://", "https://")):
                raise ConfigError("Base URL must start with http:// or https://.")
        if api_key is not None and api_key != "" and not api_key.strip():
            raise ConfigError("API key cannot be blank — leave it out to keep the current key.")

        with self._lock:
            if provider:
                self._saved["provider"] = provider
            if model:
                self._saved["model"] = model
            if api_key and api_key.strip():
                self._saved["api_key"] = api_key.strip()
            if base_url:
                self._saved["base_url"] = base_url
            # Configuration changed → previous connection evidence is stale.
            self._saved["state"] = {}
            self._persist()

    def record_result(self, success: bool, error: str | None = None) -> None:
        """Record the outcome of a real provider call (test or chat)."""
        with self._lock:
            self._saved["state"] = {
                "last_status": "connected" if success else "error",
                "last_tested_at": datetime.now(timezone.utc).isoformat(),
                "last_error": None if success else (error or "Unknown provider error."),
            }
            self._persist()
