# PhishYou: Data Protection

---

## Overview

PhishYou processes sensitive data by design: simulated attack transcripts, behavioral metrics, and employee-linked outcomes. This document defines the data protection regime — classification, encryption, retention, minimization, subject rights, and breach handling — aligned with GDPR principles, ISO 27001 controls, and the consent framework (`CONSENT_FRAMEWORK.md`).

Related: `AUDIT_LOGGING_SPEC.md`, `DATABASE_SCHEMA.md`, `ETHICAL_GUARDRAILS.md`.

---

## 1. Data Classification

| Class | Examples | Handling |
|-------|----------|----------|
| **C1 — Public** | Marketing material, product docs | No special controls |
| **C2 — Internal** | Campaign configs, persona templates, aggregate analytics | Encrypted at rest; role-based access |
| **C3 — Confidential** | Message transcripts, behavioral scores, OSINT inputs, voice recordings | Encrypted at rest + field-level; named-role access only; retention-limited |
| **C4 — Restricted** | Consent records, debrief notes, harm-detection events, audit chain | Immutable where required; legal-hold capable; CISO + Legal access |

---

## 2. Encryption & Key Management

| Layer | Control |
|-------|---------|
| At rest (PostgreSQL, object storage) | AES-256 via Alibaba Cloud KMS-managed keys |
| Field-level (C3/C4 fields: transcripts, consent, harm events) | Application-level envelope encryption; per-org data keys |
| In transit | TLS 1.3 everywhere, including internal service mesh |
| Audit chain | SHA-256 hash chain with ed25519 signing keys (`AUDIT_LOGGING_SPEC.md`) |
| Key rotation | Automatic 90-day rotation; old keys retained only for decryption of retained data |

No plaintext C3/C4 data may exist outside the encrypted datastore; LLM prompts are assembled in memory and never persisted in provider-side logs (DashScope zero-retention configuration).

---

## 3. Retention & Deletion

| Data Type | Retention | Then |
|-----------|-----------|------|
| Message content (transcripts, media) | 90 days post-campaign | Irrecoverably purged |
| Behavioral metrics & scores | 2 years (aggregate analytics value) | Anonymized |
| AAR reports | 3 years (compliance evidence) | Archive, then purge |
| Consent records | Duration of employment relationship + 5 years | Legal archive |
| Audit log chain | 7 years | Immutable; entries beyond retention carry redacted payloads |
| Voice recordings | 90 days | Purged |

Deletion is enforced by a scheduled purge job with verifiable completion receipts appended to the audit chain.

---

## 4. Minimization Rules

1. **No real credentials, ever.** Captured demo credentials (e.g., fake portal submissions) are discarded at capture — only the *event* ("credential submitted") is recorded.
2. OSINT fields are admin-supplied and capped in size; obvious credential patterns are rejected at input (`EDGE_CASES.md` EC-41).
3. Analytics consume aggregated, department-level data by default; individual-level views require named-role access and are themselves audit-logged.
4. LLM calls carry only the context needed for the next turn (2000–3000 token budget per `CONTEXT_PRESERVATION.md`), not full history.

---

## 5. Data Subject Rights

| Right | Implementation |
|-------|----------------|
| Access | Self-service export of own transcript + scores via HR portal, or request with 30-day SLA |
| Rectification | Profile metadata correctable by admin on request |
| Erasure | Post-retention purge on request where not overridden by legal hold; audit chain keeps redacted hash entries |
| Objection | Opt-out recorded in consent registry; target excluded from future campaigns |
| Portability | JSON export of personal campaign data |

---

## 6. Access Control Model

| Role | C2 | C3 | C4 |
|------|----|----|----|
| Org Admin | RW | R (own org) | R consent records |
| Security Analyst | R | R (own org, logged) | — |
| HR/Debrief Officer | — | R debrief-linked | RW debrief notes |
| PhishYou Ops | System metadata only | Break-glass (dual approval, logged) | — |
| Auditor | — | Read-only export | Audit chain verification |

Break-glass access requires two-person approval and triggers immediate notification to the customer CISO.

---

## 7. Breach Response

```
T+0h    Detection (anomalous access alert / provider notification)
T+1h    Containment: revoke keys, isolate affected store, freeze exports
T+24h   Scope assessment; DPO decides notification obligations
T+72h   Regulatory notification where required (GDPR Art. 33 window)
T+7d    Root-cause report; audit chain reviewed for tamper evidence
```

Every step is recorded in the audit chain; customer notification template is pre-approved at onboarding.

---

## 8. Compliance Mapping

| Requirement | PhishYou Control |
|-------------|------------------|
| GDPR Art. 5 (minimization, storage limitation) | §3, §4 |
| GDPR Art. 32 (security of processing) | §2, §6 |
| ISO 27001 A.8 (asset management) | §1 classification |
| SOC 2 CC6 (logical access) | §6 |
| PCI-DSS adjacent (no real cardholder data) | §4.1 — no credential capture by design |

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
