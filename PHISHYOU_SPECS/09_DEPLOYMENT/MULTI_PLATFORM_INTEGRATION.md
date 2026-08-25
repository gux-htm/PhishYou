# PhishYou: Multi-Platform Integration

---

## Overview

PhishYou delivers simulated attacks across six channels: **Email, SMS, WhatsApp, Voice, LinkedIn, and Instagram**. This document specifies how each channel adapter integrates with the orchestration core, the credentials and APIs required, message formatting rules per platform, and the failure/fallback behavior. All adapters implement a common `ChannelAdapter` interface so the agent core (`AGENT_ORCHESTRATION.md`) is channel-agnostic.

Related: `MULTI_CHANNEL_ORCHESTRATION.md` (cross-channel sequencing), `WHATSAPP_ATTACK_SPEC.md`, `EMAIL_SPOOFING.md`, `VOICE_SYNTHESIS_PIPELINE.md`, `SYSTEM_DESIGN.md`.

---

## 1. Common Channel Adapter Interface

Every platform adapter implements one interface. The orchestrator never talks to a platform SDK directly.

```python
class ChannelAdapter(ABC):
    channel: str                      # "email" | "sms" | "whatsapp" | "voice" | "linkedin" | "instagram"

    @abstractmethod
    async def send(self, message: OutboundMessage) -> DeliveryReceipt: ...

    @abstractmethod
    async def receive(self) -> InboundMessage: ...   # webhook-driven

    @abstractmethod
    async def health_check(self) -> AdapterStatus: ...

    @abstractmethod
    def format(self, content: str, media: list[Media]) -> PlatformMessage: ...
```

**DeliveryReceipt** records: `message_id`, `channel`, `status` (queued/sent/delivered/read/failed), `timestamp`, `raw_provider_response`. All receipts are written to the audit log (`AUDIT_LOGGING_SPEC.md`).

---

## 2. Channel Matrix

| Channel | Provider | Direction | Auth Method | Rate Limit (default) | Media Support |
|---------|----------|-----------|-------------|----------------------|---------------|
| Email | SMTP relay (Alibaba DirectMail / SES-compatible) | Out + bounce-in | SMTP credentials in KMS | 50 msgs/hr/target | Attachments (PDF, images) |
| SMS | Twilio Programmable SMS | Out + inbound webhook | Twilio SID/Token | 1 msg/4hr/target | None |
| WhatsApp | Twilio WhatsApp Business API | Out + inbound webhook | Twilio SID/Token + approved template | 1 msg/4hr/target (template window) | Images, documents, voice notes |
| Voice | Twilio Programmable Voice + Qwen TTS | Out call + DTMF/ASR | Twilio SID/Token | 1 call/day/target | Synthesized audio only |
| LinkedIn | Meta-less OAuth app (Graph automation account) | Out DM + reply poll | OAuth 2.0 refresh token | 20 connection req/week | None (text only) |
| Instagram | Meta Graph API (business messaging) | Out DM + webhook | Meta app token | 24h messaging window | Images, links |

> All secrets are stored in **Alibaba Cloud KMS** and injected at container startup; no credential exists in code or config files (`INFRASTRUCTURE_SETUP.md`).

---

## 3. Email Adapter

**Stack:** FastAPI worker → SMTP relay → target inbox. Spoofing surface defined in `EMAIL_SPOOFING.md`.

```python
class EmailAdapter(ChannelAdapter):
    channel = "email"

    async def send(self, message: OutboundMessage) -> DeliveryReceipt:
        mime = self.format(message.content, message.media)
        mime["From"] = message.spoofed_from          # display name + lookalike domain
        mime["Reply-To"] = message.reply_to
        mime["X-PhishYou-Campaign"] = encrypt(message.campaign_id)  # internal tracking header
        result = await smtp_pool.send(mime)
        return DeliveryReceipt.from_smtp(result)
```

Rules:
- Subject ≤ 500 characters; formal, policy-focused tone.
- Attachments limited to generated PDFs/images (fake invoices, receipts) — never executable files.
- Bounce and complaint webhooks update delivery status and feed `BLOCKING_DETECTION.md`.

---

## 4. SMS Adapter (Twilio)

```python
class SmsAdapter(ChannelAdapter):
    channel = "sms"

    async def send(self, message: OutboundMessage) -> DeliveryReceipt:
        resp = await twilio.messages.create(
            body=self.format(message.content, [])[:160 * 2],
            from_=message.spoofed_number,   # purchased/verified Twilio number
            to=message.target_phone,
        )
        return DeliveryReceipt.from_twilio(resp)
```

Rules:
- Urgent, time-pressured tone; single message ≤ 320 chars, split if longer.
- Inbound replies arrive via Twilio webhook → `/api/webhooks/twilio/sms` → orchestrator.
- `STOP` keyword is honored immediately and mapped to a block event (`BLOCKING_DETECTION.md`).

---

## 5. WhatsApp Adapter (Twilio WhatsApp Business API)

Full attack design in `WHATSAPP_ATTACK_SPEC.md`; integration specifics here.

- **Template window:** outside the 24-hour user-initiated window, only pre-approved template messages may be sent. PhishYou registers campaign templates per organization during onboarding.
- **Voice notes:** synthesized via Qwen TTS (`VOICE_SYNTHESIS_PIPELINE.md`) and delivered as audio media messages.
- Inbound webhook: `/api/webhooks/twilio/whatsapp`.

```python
class WhatsAppAdapter(ChannelAdapter):
    channel = "whatsapp"

    async def send(self, message: OutboundMessage) -> DeliveryReceipt:
        if not self.in_session(message.target_phone):
            body = self.template(message)          # approved template fallback
        else:
            body = self.format(message.content, message.media)
        resp = await twilio.messages.create(
            from_="whatsapp:" + message.spoofed_number,
            to="whatsapp:" + message.target_phone,
            body=body,
            media_url=message.media_urls,
        )
        return DeliveryReceipt.from_twilio(resp)
```

---

## 6. Voice Adapter (Twilio + Qwen TTS)

Outbound call flow:

```
Orchestrator ──► Voice Adapter ──► Twilio call ──► target phone
                     │                                  │
                     │   <──── ASR transcript (webhook) ┘
                     ▼
              Qwen LLM reply ──► Qwen TTS ──► Twilio <Say>/<Play>
```

- Conversation turns run over Twilio Media Streams; each target utterance is transcribed (ASR), scored by the behavioral analysis layer, and answered with synthesized speech.
- Only synthetic voices are used — no voice cloning (`DEEPFAKE_AUDIO_GUIDELINES.md`).
- Calls are recorded (with consent banner at campaign start) and attached to the AAR.

---

## 7. Social Platform Adapters (LinkedIn, Instagram)

| Aspect | LinkedIn | Instagram |
|--------|----------|-----------|
| Account model | Dedicated simulation account per campaign persona | Meta business account per persona |
| First contact | Connection request + note | Story reply / DM after follow |
| Trust phase | 2–3 professional messages | Casual rapport per `INSTAGRAM_DM_ATTACK.md` |
| Harvest phase | Portal link in message | Link via DM/email cross-post |
| Platform compliance | Simulation accounts only; no scraping of real employee data beyond admin-provided OSINT | Same; messaging-window rules respected |

Both adapters poll for replies at a configurable interval (default 60s) where webhooks are unavailable, and normalize them into `InboundMessage`.

---

## 8. Failure Handling & Fallback

```python
async def dispatch_with_fallback(message: OutboundMessage):
    for adapter in priority_chain(message):        # e.g. whatsapp → sms → email
        try:
            receipt = await adapter.send(message)
            if receipt.status in ("sent", "queued"):
                return receipt
        except (ProviderTimeout, RateLimited) as e:
            await log_event("adapter_failure", adapter.channel, str(e))
            continue
    await admin_alert("ALL_CHANNELS_FAILED", message.campaign_id)
```

| Failure | Response |
|---------|----------|
| Provider 5xx / timeout | Retry with exponential backoff (3 attempts), then next channel in chain |
| Rate limited | Queue in Redis with jittered retry; never exceed per-target caps |
| Template rejected (WhatsApp) | Degrade to SMS summary, alert admin |
| Adapter unhealthy (3 failed health checks) | Remove from rotation; alert ops |

---

## 9. Configuration

```yaml
channels:
  email:    { enabled: true,  max_per_target_hour: 5 }
  sms:      { enabled: true,  max_per_target_4hr: 1 }
  whatsapp: { enabled: true,  max_per_target_4hr: 1, template_fallback: true }
  voice:    { enabled: true,  max_calls_per_day: 1, record: true }
  linkedin: { enabled: false }   # enabled per-campaign by admin
  instagram:{ enabled: false }
```

Channel enablement can be scoped per campaign; the persistence tier limits (`PERSISTENCE_TIERS.md`) always apply on top.

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
