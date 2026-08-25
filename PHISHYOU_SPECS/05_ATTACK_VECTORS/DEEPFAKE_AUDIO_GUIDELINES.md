# PhishYou: Deepfake Audio Guidelines

---

## Overview

PhishYou's voice capability is **synthetic voice synthesis** (Qwen TTS with synthetic profiles) — never cloning of real individuals. This document defines the hard ethical lines, what is and isn't permitted, disclosure obligations, and how voice realism is tuned responsibly. Related technical spec: `VOICE_SYNTHESIS_SPEC.md`, `VOICE_SYNTHESIS_PIPELINE.md`.

---

## 1. Hard Ethical Lines (Non-Negotiable)

| Rule | Status |
|------|--------|
| Voice cloning of real individuals (CEO, colleague, celebrity) | **PROHIBITED** |
| Using audio samples of real people as cloning input | **PROHIBITED** |
| Live interactive voice (real-time AI call conversation) | Out of MVP scope; voicemail + outbound scripted calls only |
| Impersonating emergency services / police / medical | **PROHIBITED** |
| Voice threats of physical harm | **PROHIBITED** |
| Audio deepfake of a target's own family members | **PROHIBITED** |

All voice output derives from **licensed synthetic voice profiles** — AI-generated voices that resemble no identifiable living person.

---

## 2. Permitted Voice Usage

| Use | Description | Tiers |
|-----|-------------|-------|
| Voicemail drops | "CFO's assistant" voicemail confirming urgency | All |
| Outbound scripted calls | TTS call delivering a short message, no live conversation | A, B |
| WhatsApp voice notes | Persona voice note for authenticity | All |
| Authority confirmation audio | "IT Security Lead" audio confirming policy | A, B |
| Regional language audio | Urdu/Roman Urdu synthetic voice | A, B (localization pack) |

---

## 3. Synthetic Voice Profile Requirements

1. **Provenance:** profiles generated or licensed with commercial rights; generation metadata retained per profile.
2. **Distinctness check:** new profiles pass a similarity screen against executive voice samples the org provides (reject if close match to any real employee/exec).
3. **Watermarking:** all generated audio embeds an inaudible provenance watermark and file-metadata simulation tag.
4. **Persona binding:** profile bound to one campaign persona; reused only across campaigns of the same org.

---

## 4. Realism Tuning (Within Bounds)

| Parameter | Allowed | Notes |
|-----------|---------|-------|
| Pace/pauses | Yes | Humanized hesitation, filler sounds |
| Accent matching | Yes | Region-appropriate accent per target locale |
| Background ambience | Light | Office hum acceptable; fake emergency sounds prohibited |
| Emotional tone | Yes | Concern, authority, urgency |
| Mimicking known speech patterns of real people | **No** | |

---

## 5. Disclosure & Post-Campaign Obligations

- Debrief explicitly states which messages included synthetic audio and how it was generated.
- Coaching section teaches the target **voice-verification countermeasures**:
  - Safe-word / callback-number policies for payment approvals
  - "Hang up and dial the known number" procedure
  - Recognition of synthetic-voice tells (flat prosody under questioning, inability to handle novel dialogue)
- Org receives a policy-gap recommendation when voice was the compromising factor (e.g., "CEO voice accepted as sole authorization — add dual-control").

---

## 6. Governance & Audit

- Every generated audio logged: profile id, script text hash, timestamp, campaign.
- Scripts pass the content policy filter before synthesis (prohibited-content blocklist).
- Org attestation includes explicit voice-simulation consent category.
- If a target reports believing the voice was a *real colleague*, debrief must clarify synthetic origin immediately.

---

## 7. Future Scope (Not MVP)

Live two-way voice conversations (real-time TTS + ASR loop) are deferred pending:
- Latency budget validation (<800ms round trip)
- Stronger harm-detection integration for live distress signals
- Legal review per jurisdiction on real-time synthetic voice interaction

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
