# PhishYou: Alibaba Qwen Integration

---

## Overview

Alibaba Cloud's Qwen models via Model Studio (DashScope) power all generative intelligence in PhishYou: conversation generation, fact extraction, sentiment classification, summarization, and (with Qwen TTS) voice synthesis. This spec covers integration architecture, model selection, cost/latency budgets, prompt management, and failure handling.

---

## 1. Model Allocation

| Function | Model class | Parameters | Notes |
|----------|-------------|------------|-------|
| Adversarial conversation | Qwen-Max (or latest flagship) | max_tokens=200, temp=0.75 | Persona fidelity priority |
| Fact extraction / learned context | Qwen-Plus | max_tokens=150, temp=0.2 | Cheap, frequent |
| Sentiment classification | Qwen-Plus / Qwen-Turbo | structured output | Cached per message |
| History summarization | Qwen-Plus | max_tokens=250, temp=0.3 | On compression trigger |
| Content-policy pre-filter | Qwen-Turbo classifier | binary | Latency gate before dispatch |
| Voice synthesis | Qwen TTS | per profile | See `VOICE_SYNTHESIS_PIPELINE.md` |

Model IDs and fallbacks live in config (`INFRASTRUCTURE_SETUP.md` env), never hardcoded in prompt code.

---

## 2. Integration Architecture

```python
class QwenClient:
    def __init__(self, api_key: SecretStr, region: str = "ap-southeast-1"):
        self.endpoint = "https://dashscope.aliyuncs.com/api/v1"
        self.retry_policy = Retry(max_attempts=3, backoff="exponential_jitter")
        self.rate_limiter = TokenBucket(rps=config.qwen_rps_limit)

    async def chat(self, system: str, messages: list, **gen) -> str:
        async with self.rate_limiter:
            resp = await self.post("/services/aigc/text-generation/generation",
                payload={"model": gen.pop("model"), "input": {"messages": [
                            {"role": "system", "content": system}, *messages]},
                         "parameters": gen},
                headers={"Authorization": f"Bearer {self.api_key}"})
            return resp.output.text
```

- SDK: official DashScope Python SDK or REST wrapper; async throughout.
- Region selection aligned with tenant data-residency config.
- PII-stripping middleware runs before every outbound call (`DATA_FLOW_DIAGRAM.md` TB-3).

---

## 3. Prompt Management

- System prompts assembled from versioned templates (`LLM_SYSTEM_PROMPTS.md`); template versions pinned per campaign for reproducibility.
- Prompt registry table: `prompt_templates(id, name, version, content_hash, status)`.
- A/B prompt experiments: campaign-level assignment; effectiveness compared via `ATTACK_EFFECTIVENESS_SCORING.md`.
- No tenant conversation data used to fine-tune shared models.

---

## 4. Budgets & Cost Control

| Budget | Target |
|--------|--------|
| Per-turn generation latency | p95 ≤ 5s (incl. analysis pipeline) |
| Per-engagement token cost ceiling | Alert at 150% of estimate |
| Org monthly quota | Configurable hard cap; campaigns queue beyond it |
| Voice generation | ≤30s per 10s audio clip |

Cost telemetry per campaign feeds the admin dashboard (tokens in/out per engagement).

---

## 5. Failure Handling

| Failure | Handling |
|---------|----------|
| 429 rate limit | Exponential backoff + jitter; queue follow-ups (never drop) |
| 5xx / timeout | Retry ×3; then hold conversation and alert ops; target sees natural "typing delay" |
| Content filter rejection (model-side) | Regenerate with softened framing (max 3); still blocked → escalate to admin review |
| Region outage | Failover to secondary region endpoint; campaign state unaffected (PostgreSQL) |
| Quota exhausted | Campaign pauses with admin notification; no silent degradation |

---

## 6. Observability

- Every LLM call logged: model, tokens in/out, latency, campaign/target refs (content hashed).
- Dashboards: p50/p95 latency, error rate, tokens/campaign, cost accrual.
- Model-version drift alerts when provider changes default model behavior (golden-prompt regression suite runs nightly, `ADVERSARIAL_TESTING.md`).

---

## 7. Hackathon / MVP Notes

- Single DashScope API key in env (`QWEN_API_KEY`), stored in Alibaba Cloud KMS for production.
- MVP uses Qwen-Max for conversation + Qwen-Turbo for classifiers to balance demo quality and quota.
- Regional demo (Roman Urdu) relies on Qwen's multilingual strength; validation set tracked in `LOCALIZATION_FRAMEWORK.md`.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
