# PhishYou: Edge Cases

---

## Overview

Edge cases define the boundary conditions where PhishYou's orchestration, safety, and state systems must behave deterministically even when inputs are rare or ambiguous. Each case specifies the trigger, required system behavior, and the owner component. Cases here are exercised by regression tests alongside `ADVERSARIAL_TESTING.md` and `PERSISTENCE_TESTING.md`.

Related: `STATE_MACHINE_LOGIC.md`, `BLOCKING_DETECTION.md`, `HARM_DETECTION_OPTIONAL.md`, `MULTI_PLATFORM_INTEGRATION.md`.

---

## 1. Target-Side Edge Cases

| ID | Case | Required Behavior |
|----|------|-------------------|
| EC-01 | Target never replies to any message | After 3 unanswered touches on the primary channel, pivot channel once; if silence persists 72h, mark `COLD` and schedule weekly re-touch only (no daily spam) |
| EC-02 | Target replies after 14 days of silence | Reload preserved context (`CONTEXT_PRESERVATION.md`); re-open at one intensity level below where conversation paused |
| EC-03 | Target replies with only emoji / sticker | Score as micro-signal, do not treat as compliance; agent acknowledges neutrally and re-states the ask |
| EC-04 | Target forwards the conversation to a colleague (new responder) | Detect identity shift (name/register mismatch); agent continues persona but logs `responder_change`; AAR attributes outcome to original target with caveat |
| EC-05 | Target replies in a group chat instead of DM | Agent does not post to groups; treat as no-reply, continue on private channel only |
| EC-06 | Target's account is deactivated mid-campaign | Delivery failures ≥ 2 → mark `CHANNEL_LOST`; campaign ends with `INCOMPLETE` outcome |

---

## 2. Safety Edge Cases

| ID | Case | Required Behavior |
|----|------|-------------------|
| EC-10 | Target discloses personal crisis (bereavement, health emergency) | Immediate pause regardless of tier; support message + admin alert within 60s |
| EC-11 | Harm signal exactly at threshold (score = 0.60) | Treat as triggered (threshold is inclusive); fail-safe direction is always pause |
| EC-12 | Two harm signals from different detectors disagree | Take the MAX severity; never average down |
| EC-13 | Target says "stop" as part of a larger compliant sentence ("don't stop, I'll do it") | Semantic refusal classifier decides; if confidence < 0.7, treat as refusal (fail-safe) |
| EC-14 | Admin halts campaign while a message is in flight | Outbound queue drain checks campaign state at send-time; in-flight message suppressed, receipt logged as `suppressed_by_admin` |

---

## 3. Platform & Delivery Edge Cases

| ID | Case | Required Behavior |
|----|------|-------------------|
| EC-20 | WhatsApp session window closed | Fall back to approved template or SMS per `MULTI_PLATFORM_INTEGRATION.md`; never silently drop |
| EC-21 | Voice call answered by voicemail | Leave no message by default (config: allow scripted message); log `voicemail_reached` |
| EC-22 | Target blocks persona on WhatsApp but campaign also has SMS enabled | Block is campaign-scoped by default: all channels stop; org can configure channel-scoped blocks in campaign settings |
| EC-23 | Provider outage (Twilio/SMTP down > 15 min) | Pause affected channel, alert ops, preserve queue; on recovery, send oldest-first with jitter |
| EC-24 | Duplicate inbound webhook (provider retry) | Idempotency key on `(provider_message_id)`; process once |

---

## 4. State Machine & Timing Edge Cases

| ID | Case | Required Behavior |
|----|------|-------------------|
| EC-30 | Resistance score crosses two bands in one turn (0.3 → 0.7) | Apply ladder for final band only; log both scores |
| EC-31 | Campaign scheduled at 02:00 target-local (quiet hours) | All sends shift into next send window (default 09:00–19:00 org-local); Tier A may override via explicit admin flag |
| EC-32 | DST/timezone change mid-campaign | All schedules stored UTC; rendered in target-local tz; window checks use target-local time |
| EC-33 | Two triggers fire same tick (e.g., escalation + daily cap) | Enforcement checks run in order: block → harm → tier caps → scheduling; first deny wins |
| EC-34 | Redis scheduler crash mid-queue | Scheduler persists schedules in PostgreSQL as source of truth; Redis is cache only; recovery replays due schedules |

---

## 5. Data & Privacy Edge Cases

| ID | Case | Required Behavior |
|----|------|-------------------|
| EC-40 | Target exercises data deletion right post-campaign | Content purged after retention window; audit log retains hash chain with redacted payloads (`DATA_PROTECTION.md`) |
| EC-41 | OSINT input contains apparent credentials submitted by admin | Reject at campaign creation; alert admin; never store |
| EC-42 | Voice recording storage fails | Call may proceed only if `record: false` fallback is disabled-for-org; otherwise refuse call initiation |

---

## 6. Handling Rule of Thumb

Every edge case follows the fail-safe hierarchy:

```
Human safety  >  Consent & privacy  >  Tier limits  >  Campaign realism
```

When behavior is ambiguous, the system resolves toward the leftmost value.

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
