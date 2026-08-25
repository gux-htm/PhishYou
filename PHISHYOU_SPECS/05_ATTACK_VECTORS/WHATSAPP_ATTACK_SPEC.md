# PhishYou: WhatsApp Attack Spec

---

## Overview

WhatsApp is the highest-intimacy channel: personal device, informal tone, read receipts, and voice notes. This spec covers number provisioning, message construction rules, media usage, delivery mechanics, and the regional (Pakistani fintech) variant.

---

## 1. Number & Identity Provisioning

| Element | Implementation |
|---------|----------------|
| Number | Twilio WhatsApp Business API sender registered to the org's campaign account |
| Display name | Persona name (e.g., "HBL Security", "Asif — IT Support") |
| Avatar | Stable Diffusion synthetic headshot OR institutional logo per persona |
| About/profile text | Persona-consistent ("Official security communications") |
| Verification badge | Never claimed; no fake "verified" assertions |

Numbers are campaign-scoped and released at campaign end. Block events on the number are final (`BLOCKING_DETECTION.md`).

---

## 2. Message Construction Rules

```
Length:      ≤200 chars per message; split longer content across 2-3 bubbles
Tone:        Casual urgency; contractions allowed; persona-dependent formality
Emoji:       Per persona emoji policy (bank persona: sparse; colleague persona: natural)
Formatting:  *bold* for deadlines; no markdown tables
Links:       Short branded simulation domain with preview card
Voice notes: Qwen TTS generated (see VOICE_SYNTHESIS_SPEC.md)
Documents:   Generated PDFs (invoices, memos) — watermarked metadata
```

**Realism rules:**
- Simulate typing rhythm: messages arrive with human-like gaps (5–40s between bubbles), never instant walls of text.
- Read-receipt timing: agent waits plausible time after target's "seen" before replying (based on fatigue/timing model).
- Typos policy: 1 plausible typo per ~10 messages in casual personas; corrected naturally.

---

## 3. Conversation Openers by Persona

| Persona | Opener pattern |
|---------|----------------|
| Bank Security (P-02) | "Hi {name}, this is {bank} Security. We noticed an unusual login attempt on your account. Are you available for 2 minutes?" |
| Telecom/Fintech (P-09, Roman Urdu) | "Assalam o Alaikum {name}, aap ka account verify karna zaroori hai warna block ho jayega. Sirf 10 minute ka kaam hai." |
| IT Support (P-01) | "Hey {first_name}, quick one — did you get the security audit email? Deadline's today." |
| Colleague (P-04) | "Hey! Busy? Need a small favor 🙏" |

Openers end with a *question* — open loops get replies; statements get ignored.

---

## 4. Media Escalation Sequence

```
Turn 1-2:  Text only (build context)
Turn 3:    Link or screenshot ("here's the portal")
Turn 4:    Voice note from persona (authenticity boost)
Turn 5+:   Document PDF (invoice/statement) if payment chain
```

Voice notes are the single highest-conversion media on WhatsApp; used at the first strong hesitation.

---

## 5. Delivery & Webhook Mechanics

```python
async def whatsapp_send(campaign, target, content):
    resp = await twilio.messages.create(
        from_=campaign.whatsapp_sender,      # whatsapp:+1XXXXXXXXXX
        to=f"whatsapp:{target.phone}",
        body=content.text,
        media_url=content.media_urls or None,
    )
    await audit.log("WHATSAPP_SENT", campaign.id, target.id, resp.sid)

# Inbound: Twilio webhook → signature verified → router → TargetAgent
# Status callbacks: sent / delivered / read / failed / blocked tracked per message
```

| Callback | Analytics use |
|----------|---------------|
| delivered → read gap | Attention level |
| read → reply gap | Resistance/timing signal (`TIMING_PATTERN_DETECTION.md`) |
| failed / restricted | Number hygiene; possible platform block |

---

## 6. Regional Variant — Pakistani Fintech

- **Language:** Roman Urdu default; code-switch to English for technical terms ("OTP", "verify").
- **Cultural calibration:** formal greeting (Assalam o Alaikum) for bank personas; amounts in PKR; reference plausible local flows (bill payment, mobile top-up, JazzCash/Easypaisa-style patterns).
- **Timing:** avoid Friday prayer window (13:00–14:30 PKT) for sends; Ramadan hours shifted per org config.
- **Compliance:** scenario references no real institution by name unless the org is that institution.
- Reference: `DEMO_SCENARIO_PAKISTANI_FINTECH.md`.

---

## 7. Governance Constraints

- No messages between 23:00–07:00 target local time (Tier C) / admin-flag required (Tier B).
- No content referencing family members' safety, health scares, or religious pressure.
- Target block is detected via Twilio status/webhooks and ends the channel permanently for this campaign.
- All media carries simulation watermark in file metadata.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
