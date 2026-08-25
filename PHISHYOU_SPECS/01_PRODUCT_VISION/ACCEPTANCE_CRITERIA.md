# PhishYou: Acceptance Criteria

---

## Overview

Every locked feature has measurable acceptance criteria. A feature is **DONE** only when all its criteria pass in a staging environment against the full test suite (`10_TESTING/TEST_SCENARIOS.md`).

Status legend: ✅ testable automatically | 👁 requires manual/judge verification

---

## AC-1: Multi-Platform Attack Orchestration

| # | Criterion | Verification |
|---|-----------|--------------|
| 1.1 | Admin can create a campaign targeting Email, WhatsApp, SMS, Instagram, or LinkedIn from a single dashboard flow | ✅ |
| 1.2 | AI generates platform-appropriate tone per channel (formal email ≤500 char subject, WhatsApp ≤200 char chunks) | ✅ |
| 1.3 | A single campaign can span ≥3 platforms with shared persona identity and shared conversation memory | ✅ |
| 1.4 | Campaign launches within 60 seconds of admin confirmation | ✅ |
| 1.5 | Switching channel mid-campaign preserves full context (no repeated introductions) | ✅ |

## AC-2: Intelligent Spoofing Stack

| # | Criterion | Verification |
|---|-----------|--------------|
| 2.1 | Email campaigns send from admin-authorized domains only (SPF/DKIM verification enforced at setup) | ✅ |
| 2.2 | Display name, avatar, and profile metadata are generated consistently with the chosen persona | ✅ |
| 2.3 | Link previews for phishing portals render correctly on WhatsApp and SMS | ✅ |
| 2.4 | Every spoofed artifact carries an internal `X-PhishYou-Sim` audit marker visible only to the platform's audit log, never to the target | ✅ |
| 2.5 | No spoofing of emergency services, government agencies, or medical institutions is permitted (hard block) | ✅ |

## AC-3: AI Adversarial Agent (Multi-Turn Conversation)

| # | Criterion | Verification |
|---|-----------|--------------|
| 3.1 | Agent maintains a single persona across ≥20 conversation turns with zero character breaks | ✅ |
| 3.2 | Agent responds to target messages with p95 latency ≤5 seconds | ✅ |
| 3.3 | Agent adapts tactic when resistance score crosses thresholds (0.2 / 0.4 / 0.6 / 0.8) | ✅ |
| 3.4 | Agent never self-halts; only admin halt, platform block, or campaign expiry stops it | ✅ |
| 3.5 | Agent refuses to generate content that is illegal outside simulation scope (real malware, real financial movement) | ✅ |
| 3.6 | Responses pass the plausibility gate: no self-identification as AI to the target during an active campaign | 👁 |

## AC-4: Behavioral Analysis Engine

| # | Criterion | Verification |
|---|-----------|--------------|
| 4.1 | Emoji microanalysis classifies sentiment shifts for ≥30 mapped emoji with ≥85% agreement against labeled test set | ✅ |
| 4.2 | Response-latency anomaly detection flags ≥2σ deviation from target baseline | ✅ |
| 4.3 | Composite resistance score (0–1) is computed for every target message and persisted | ✅ |
| 4.4 | Resistance score drift ≤0.1 when the same message is analyzed twice (determinism guard) | ✅ |
| 4.5 | Skepticism markers ("is this real?", "let me verify") are detected in English and Roman Urdu | ✅ |

## AC-5: Persistence Engine (Tiers A/B/C)

| # | Criterion | Verification |
|---|-----------|--------------|
| 5.1 | Tier A continues indefinitely until admin halt, target block, or campaign expiry | ✅ |
| 5.2 | Tier B enforces max 2 escalation levels and honors 1 pause/day (24h auto-resume) | ✅ |
| 5.3 | Tier C enforces 10 messages/day, 3 escalations max, and 72h cool-off after refusal | ✅ |
| 5.4 | Platform block is respected on all tiers; AI never auto-switches platform after a block | ✅ |
| 5.5 | Tier upgrades (C→B, C→A, B→A) are permitted mid-campaign; downgrades are rejected | ✅ |
| 5.6 | Every escalation event is written to the immutable audit log | ✅ |

## AC-6: Media Generation (Voice, Documents, Images)

| # | Criterion | Verification |
|---|-----------|--------------|
| 6.1 | Voice synthesis produces ≥10-second audio in ≤30 seconds via Qwen TTS | ✅ |
| 6.2 | Voice profile matches campaign persona (gender, accent, age bracket) | 👁 |
| 6.3 | Fake document generation (invoice, policy memo) renders PDF in ≤15 seconds | ✅ |
| 6.4 | All generated media is watermarked in metadata as simulation artifacts | ✅ |
| 6.5 | Voice cloning of real individuals is prohibited; only synthetic voice profiles allowed | ✅ |

## AC-7: Analytics & AAR Engine

| # | Criterion | Verification |
|---|-----------|--------------|
| 7.1 | Real-time dashboard shows live resistance score, tactic in use, and message feed with ≤5s staleness | ✅ |
| 7.2 | AAR generates within 5 minutes of campaign completion for campaigns up to 500 messages | ✅ |
| 7.3 | AAR contains all 7 mandatory sections (timeline, trigger effectiveness, time-to-compromise, policy gaps, comparison, coaching, recommendations) | ✅ |
| 7.4 | Behavioral metrics export in CSV and JSON | ✅ |
| 7.5 | Next-campaign recommendations reference actual measured weaknesses from the previous campaign | 👁 |

## AC-8: Ethics, Consent & Audit

| # | Criterion | Verification |
|---|-----------|--------------|
| 8.1 | No campaign can start without a signed organizational consent attestation on file | ✅ |
| 8.2 | Employee exemption list is enforced — exempt targets are excluded from targeting automatically | ✅ |
| 8.3 | Every message, escalation, and admin action is written to the immutable, hash-chained audit log | ✅ |
| 8.4 | Mandatory debrief is delivered to every target within 24h of campaign end | ✅ |
| 8.5 | Data retention policy auto-deletes conversation content after the configured period (default 90 days) | ✅ |
| 8.6 | Consent withdrawal halts the affected target's engagement within 60 seconds | ✅ |

---

## Non-Functional Acceptance Criteria

| Area | Criterion |
|------|-----------|
| **Performance** | 50 concurrent campaigns, 1000 active targets, p95 LLM response ≤5s |
| **Availability** | 99.5% uptime for campaign engine; campaign state survives restarts |
| **Security** | OAuth2 scopes enforced; PII encrypted at rest (AES-256) and in transit (TLS 1.3) |
| **Localization** | English + Roman Urdu end-to-end (prompts, analysis, debrief) |
| **Auditability** | Audit log integrity verifiable via hash-chain check tool |

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
