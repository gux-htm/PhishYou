"""PhishYou backend — LLM provider abstraction.

AIProvider defines the contract the API layer codes against: a real
connection test and a real chat call. OpenRouterProvider (the default)
implements it against the standard OpenRouter chat-completions endpoint;
QwenProvider implements it for Alibaba Cloud's DashScope REST API per
PHISHYOU_SPECS/09_DEPLOYMENT/ALIBABA_QWEN_INTEGRATION.md §2.

Adding another provider later = implement this interface and register it
in build_provider() — no API-layer or chat-UI changes required.

Responses are NON-STREAMING. Reasoning tokens never reach the UI: providers
read only the model's final answer and drop reasoning_details fields and
<think> blocks.
"""
from __future__ import annotations

import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import httpx

# Budgets: free-tier models are slow to first token — generous ceilings keep
# the connection test and chat usable on the slow paths.
TEST_TIMEOUT_S = 20.0
CHAT_TIMEOUT_S = 90.0
TEST_MAX_TOKENS = 32
CHAT_MAX_TOKENS = 2048
CHAT_TEMPERATURE = 0.7

# Neutral assistant prompt — this page proves connectivity only; campaign
# content generation is explicitly out of scope for this integration.
DEFAULT_SYSTEM_PROMPT = (
    "You are the PhishYou AI assistant. Answer helpfully, accurately and concisely."
)

# DashScope throttling codes seen in the wild (ALIBABA_QWEN_INTEGRATION.md §5).
_RATE_LIMIT_CODES = {
    "throttling",
    "throttling.ratequota",
    "throttling.allocationquota",
    "throttling.ratelimitquota",
    "throttling.triggeredflow",
}

_THINK_BLOCK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def _strip_reasoning(text: str) -> str:
    """Keep only the model's final answer.

    Some reasoning models inline <think>…</think> blocks inside `content`
    (reasoning_details fields are never read in the first place).
    """
    if not text:
        return ""
    text = _THINK_BLOCK_RE.sub("", text)
    if "<think>" in text:  # unterminated block — the rest is reasoning
        text = text.split("<think>", 1)[0]
    if "</think>" in text:  # opener lost to truncation — keep the tail
        text = text.rsplit("</think>", 1)[1]
    return text.strip()


def _redact(text: str, secret: str) -> str:
    """Defense-in-depth: provider messages must never echo the API key."""
    if secret and secret in text:
        return text.replace(secret, "••••")
    return text


class ProviderError(Exception):
    """A safe, user-facing provider failure (never contains the API key)."""

    def __init__(self, message: str, kind: str = "provider") -> None:
        super().__init__(message)
        self.message = message
        self.kind = kind  # not_configured | auth | model | rate_limit | timeout | network | provider


@dataclass
class ChatMessage:
    role: str  # 'system' | 'user' | 'assistant'
    content: str

    def as_payload(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


class AIProvider(ABC):
    """Contract every LLM integration must satisfy."""

    id: str = "abstract"
    label: str = "Abstract provider"

    @abstractmethod
    async def test_connection(self) -> dict[str, Any]:
        """Perform a REAL round-trip; return {'latency_ms', 'model'} on
        success and raise ProviderError on failure."""

    @abstractmethod
    async def chat(self, messages: list[ChatMessage]) -> str:
        """Send a full conversation and return the assistant reply text."""


class QwenProvider(AIProvider):
    """Alibaba Cloud Qwen via the DashScope text-generation REST API."""

    id = "qwen"
    label = "Alibaba Cloud Qwen (DashScope)"
    GENERATION_PATH = "/services/aigc/text-generation/generation"

    def __init__(self, api_key: str, model: str, base_url: str) -> None:
        if not api_key:
            raise ProviderError(
                "The AI provider is not configured — save an API key first.", "not_configured"
            )
        if not model:
            raise ProviderError("No model configured for the AI provider.", "model")
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    # -- core call --------------------------------------------------------

    async def _generate(
        self, messages: list[ChatMessage], parameters: dict[str, Any], timeout: float
    ) -> str:
        url = f"{self.base_url}{self.GENERATION_PATH}"
        payload = {
            "model": self.model,
            "input": {"messages": [m.as_payload() for m in messages]},
            "parameters": parameters,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise ProviderError(
                f"The AI provider did not respond within {int(timeout)} seconds.", "timeout"
            )
        except httpx.HTTPError:
            raise ProviderError(
                "Could not reach the AI provider endpoint — check the base URL and network.",
                "network",
            )

        try:
            body = resp.json()
        except ValueError:
            body = {}

        code = str(body.get("code", "") or "")
        detail = _redact(str(body.get("message", "") or ""), self.api_key)

        if resp.status_code in (401, 403) or code in ("InvalidApiKey", "Unauthorized"):
            raise ProviderError("The API key was rejected by the provider.", "auth")
        if resp.status_code == 429 or code.lower() in _RATE_LIMIT_CODES:
            raise ProviderError(
                "Rate limited by the AI provider — wait a moment and try again.", "rate_limit"
            )
        if resp.status_code == 404 or "model" in code.lower() or "model" in detail.lower():
            raise ProviderError(
                f"The configured model (“{self.model}”) is not available for this API key.",
                "model",
            )
        if resp.status_code >= 400:
            suffix = f": {detail}" if detail else "."
            raise ProviderError(
                f"The AI provider returned an error (HTTP {resp.status_code}){suffix}", "provider"
            )

        output = body.get("output") or {}
        choices = output.get("choices") or []
        content = None
        if choices and isinstance(choices[0], dict):
            content = (choices[0].get("message") or {}).get("content")
        if not content:
            content = output.get("text")  # legacy non-streaming shape
        if not content:
            raise ProviderError("The AI provider returned an empty response.", "provider")
        return content

    # -- AIProvider -------------------------------------------------------

    async def test_connection(self) -> dict[str, Any]:
        started = time.perf_counter()
        await self._generate(
            [ChatMessage(role="user", content="Connection check — reply with the single word: pong")],
            {"max_tokens": TEST_MAX_TOKENS, "temperature": 0.1},
            TEST_TIMEOUT_S,
        )
        return {"latency_ms": round((time.perf_counter() - started) * 1000), "model": self.model}

    async def chat(self, messages: list[ChatMessage]) -> str:
        conversation = list(messages)
        if not conversation or conversation[0].role != "system":
            conversation.insert(0, ChatMessage(role="system", content=DEFAULT_SYSTEM_PROMPT))
        return await self._generate(
            conversation,
            {"max_tokens": CHAT_MAX_TOKENS, "temperature": CHAT_TEMPERATURE},
            CHAT_TIMEOUT_S,
        )


class OpenRouterProvider(AIProvider):
    """OpenRouter — standard OpenAI-compatible chat completions, non-streaming.

    Only choices[0].message.content is ever read; reasoning_details and any
    internal reasoning tokens are deliberately ignored.
    """

    id = "openrouter"
    label = "OpenRouter"
    DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
    CHAT_PATH = "/chat/completions"

    def __init__(self, api_key: str, model: str, base_url: str | None = None) -> None:
        if not api_key:
            raise ProviderError(
                "The AI provider is not configured — save an API key first.", "not_configured"
            )
        if not model:
            raise ProviderError("No model configured for the AI provider.", "model")
        self.api_key = api_key
        self.model = model
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")

    # -- core call --------------------------------------------------------

    async def _post(
        self, messages: list[ChatMessage], max_tokens: int, temperature: float, timeout: float
    ) -> dict[str, Any]:
        """POST {base_url}/chat/completions; return the parsed body or raise."""
        url = f"{self.base_url}{self.CHAT_PATH}"
        payload = {
            "model": self.model,
            "messages": [m.as_payload() for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Title": "PhishYou",  # optional app attribution header
        }
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise ProviderError(
                f"OpenRouter did not respond within {int(timeout)} seconds.", "timeout"
            )
        except httpx.HTTPError:
            raise ProviderError(
                "Could not reach OpenRouter — check the base URL and network.", "network"
            )
        try:
            body = resp.json()
        except ValueError:
            body = {}
        if not isinstance(body, dict):
            body = {}
        if resp.status_code >= 400:
            raise self._error_for(resp.status_code, body)
        return body

    def _error_for(self, status_code: int, body: dict[str, Any]) -> ProviderError:
        """Map an OpenRouter failure onto a safe, user-facing error."""
        err = body.get("error")
        detail = ""
        if isinstance(err, dict):
            detail = str(err.get("message") or "")
        elif err:
            detail = str(err)
        detail = _redact(detail[:300], self.api_key)

        if status_code == 401:
            return ProviderError("OpenRouter rejected the API key (invalid credentials).", "auth")
        if status_code == 403:
            return ProviderError(
                "OpenRouter refused the request — the API key may lack access to this model.",
                "auth",
            )
        if status_code == 402:
            return ProviderError(
                "The OpenRouter account has insufficient credits for this model.", "provider"
            )
        if status_code == 404 or (status_code == 400 and "model" in detail.lower()):
            return ProviderError(
                f"The configured model (“{self.model}”) is not available on OpenRouter.",
                "model",
            )
        if status_code == 408:
            return ProviderError(
                "OpenRouter timed out serving this model — try again or pick another model.",
                "timeout",
            )
        if status_code == 429:
            return ProviderError(
                "Rate limited by OpenRouter — free-tier models are heavily shared; "
                "wait a moment and retry.",
                "rate_limit",
            )
        suffix = f": {detail}" if detail else ""
        return ProviderError(
            f"OpenRouter returned an error (HTTP {status_code}){suffix}", "provider"
        )

    # -- AIProvider -------------------------------------------------------

    async def test_connection(self) -> dict[str, Any]:
        started = time.perf_counter()
        body = await self._post(
            [ChatMessage(role="user", content="Connection check — reply with the single word: pong")],
            TEST_MAX_TOKENS,
            0.1,
            TEST_TIMEOUT_S,
        )
        # A 2xx round-trip proves the key and model are live. Some reasoning
        # models spend the tiny test budget on hidden reasoning, so the
        # echoed model id — not the reply text — is the connectivity proof.
        return {
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "model": str(body.get("model") or self.model),
        }

    async def chat(self, messages: list[ChatMessage]) -> str:
        conversation = list(messages)
        if not conversation or conversation[0].role != "system":
            conversation.insert(0, ChatMessage(role="system", content=DEFAULT_SYSTEM_PROMPT))
        body = await self._post(conversation, CHAT_MAX_TOKENS, CHAT_TEMPERATURE, CHAT_TIMEOUT_S)
        choices = body.get("choices") or []
        choice = choices[0] if choices and isinstance(choices[0], dict) else {}
        message = choice.get("message")
        raw = message.get("content") if isinstance(message, dict) else None
        if isinstance(raw, list):  # multi-part content shape
            raw = "".join(part.get("text", "") for part in raw if isinstance(part, dict))
        content = _strip_reasoning(raw if isinstance(raw, str) else "")
        if not content:
            if choice.get("finish_reason") == "length":
                raise ProviderError(
                    "The model spent its token budget on internal reasoning and produced "
                    "no final answer — retry or switch to a model with visible answers.",
                    "provider",
                )
            raise ProviderError("OpenRouter returned an empty response.", "provider")
        return content


def build_provider(cfg: dict[str, Any]) -> AIProvider:
    """Factory — swap providers here without touching the API layer."""
    provider_id = cfg.get("provider") or OpenRouterProvider.id
    if provider_id == OpenRouterProvider.id:
        return OpenRouterProvider(
            api_key=cfg.get("api_key", ""),
            model=cfg.get("model", ""),
            base_url=cfg.get("base_url") or None,
        )
    if provider_id == QwenProvider.id:
        return QwenProvider(
            api_key=cfg.get("api_key", ""),
            model=cfg.get("model", ""),
            base_url=cfg.get("base_url", "https://dashscope.aliyuncs.com/api/v1"),
        )
    raise ProviderError(f"Unsupported provider “{provider_id}”.", "provider")
