# PhishYou: Data Flow Diagram

---

## Overview

This document traces every data flow through PhishYou from campaign creation to AAR delivery, with data classifications at each hop. It complements `SYSTEM_DESIGN.md` (components) and `API_CONTRACTS.md` (interfaces).

Data classifications used:
- **PUBLIC** – non-sensitive (campaign names, personas)
- **INTERNAL** – operational (state, scheduling)
- **PII** – target identity and contact details
- **SENSITIVE** – conversation content, behavioral scores, consent records
- **AUDIT** – immutable signed logs

---

## 1. End-to-End High-Level Flow

```
┌──────────┐   1. Create Campaign    ┌───────────────────────────┐
│  ADMIN   │ ───────────────────────▶│  CAMPAIGN ORCHESTRATION   │
│ DASHBOARD│   (OAuth2, PUBLIC+PII)  │  ENGINE (FastAPI)         │
└──────────┘                         └────────────┬──────────────┘
                                                  │ 2. Consent gate check
                                                  ▼
                                     ┌───────────────────────────┐
                                     │  CONSENT & TARGETING SVC  │
                                     │  (SENSITIVE)              │
                                     └────────────┬──────────────┘
                                                  │ 3. Approved targets
                                                  ▼
┌──────────┐   5. Target replies     ┌───────────────────────────┐
│ PLATFORM │ ◀────── 4. Send msg ────│  AI ADVERSARIAL AGENT     │
│ GATEWAY  │ ───────────────────────▶│  (LangChain + Qwen LLM)   │
│(Twilio/  │   (PII+SENSITIVE)       │  + Behavioral Analyzer    │
│ SMTP/    │                         └────────────┬──────────────┘
│ Graph)   │                                      │ 6. Log everything
└──────────┘                                      ▼
                                     ┌───────────────────────────┐
                                     │  POSTGRESQL               │
                                     │  messages (immutable),    │
                                     │  analytics, audit_logs    │
                                     └────────────┬──────────────┘
                                                  │ 7. On campaign end
                                                  ▼
                                     ┌───────────────────────────┐
                                     │  ANALYTICS / AAR ENGINE   │──▶ 8. AAR PDF
                                     └───────────────────────────┘    to Admin
```

---

## 2. Flow Details

### Flow 1: Campaign Creation (Admin → Orchestration Engine)
| Attribute | Value |
|-----------|-------|
| Trigger | Admin clicks "Launch Campaign" |
| Payload | Targets (PII), persona config (PUBLIC), tier, triggers, duration (INTERNAL) |
| Transport | HTTPS/TLS 1.3, OAuth2 scope `campaign:write` |
| Store | `campaigns`, `targets` tables |

### Flow 2: Consent Gate (Orchestration → Consent Service)
| Attribute | Value |
|-----------|-------|
| Rule | Campaign **cannot** proceed unless org attestation + per-target consent = SIGNED |
| Payload | target_id ↔ consent_forms lookup |
| Failure mode | Target silently excluded from targeting list; admin sees "N targets excluded (consent)" |

### Flow 3: Target Delivery (Agent → Platform Gateway → Target)
| Attribute | Value |
|-----------|-------|
| Channels | SMTP (email), Twilio (SMS/WhatsApp), Meta Graph (Instagram/LinkedIn) |
| Payload | Generated message (SENSITIVE) + spoofed identity (INTERNAL) |
| Markers | Internal audit header only; invisible to target |

### Flow 4: Inbound Reply (Target → Platform Gateway → Agent)
| Attribute | Value |
|-----------|-------|
| Trigger | Target replies / delivery status webhook |
| Payload | Message text, timestamp, media refs |
| Processing | Behavioral analyzer computes resistance score **before** LLM response |

### Flow 5: LLM Round-Trip (Agent → Qwen Model Studio)
| Attribute | Value |
|-----------|-------|
| Outbound | System prompt + last 10 messages + condensed context |
| Inbound | Response text (max 200 tokens, temp 0.75) |
| Sanitization | Outbound context strips direct PII (replaces with role references); no raw phone numbers sent to LLM |

### Flow 6: Persistence (Agent → PostgreSQL)
| Table | Classification | Retention |
|-------|----------------|-----------|
| `messages` | SENSITIVE (immutable append-only) | 90 days default |
| `campaign_analytics` | SENSITIVE | 2 years |
| `audit_logs` | AUDIT (hash-chained, signed) | 7 years |
| `consent_forms` | SENSITIVE | Until withdrawal + 30 days |

### Flow 7: Analytics Pipeline (PostgreSQL → AAR Engine)
- Triggered on campaign COMPLETED/HALTED event
- Reads `messages`, `campaign_analytics`, behavioral scores
- Computes trigger effectiveness, time-to-compromise, policy gaps
- Writes `aar_reports` table

### Flow 8: Reporting (AAR Engine → Admin)
- PDF export + dashboard view; OAuth2 scope `analytics:read`
- Employee-level detail visible only to roles with `pii:read` grant

---

## 3. Real-Time Dashboard Flow

```
Agent ──(each message event)──▶ Redis Pub/Sub ──▶ WebSocket Gateway ──▶ Dashboard
                                       │
                                       └──▶ analytics cache (5s TTL)
```

Dashboard staleness budget: ≤5 seconds end-to-end.

---

## 4. External System Boundaries

| External System | Data Exchanged | Direction | Controls |
|-----------------|----------------|-----------|----------|
| Alibaba Qwen LLM (Model Studio) | Prompt context (PII-stripped) | Out | API key in vault; no training on our data per contract |
| Alibaba Qwen TTS | Script text | Out | Same as above |
| Twilio | Messages, numbers, delivery status | Both | Signed webhooks verified |
| SMTP Provider | Email content | Out | Domain allowlist; SPF/DKIM pre-verified |
| Meta Graph API | DMs, presence | Both | OAuth tokens, per-org sandbox accounts |

---

## 5. Trust Boundaries

1. **TB-1: Internet ↔ API Gateway** – WAF, rate limiting, OAuth2 required
2. **TB-2: API ↔ AI Agent** – internal VPC, mTLS between services
3. **TB-3: Agent ↔ External LLM** – PII-stripping middleware enforced before egress
4. **TB-4: App ↔ Database** – encryption at rest, per-tenant row-level isolation
5. **TB-5: Admin ↔ Dashboard** – MFA required for all campaign:write actions

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
