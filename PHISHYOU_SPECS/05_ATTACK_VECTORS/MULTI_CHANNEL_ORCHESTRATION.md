# PhishYou: Multi-Channel Orchestration

---

## Overview

Real adversaries don't live on one channel. Multi-channel orchestration coordinates Email, WhatsApp, SMS, Voice, LinkedIn, and Instagram as a single coherent attack: one persona, one memory, sequenced appearances. This spec defines channel roles, sequencing patterns, coordination rules, and block governance.

---

## 1. Channel Roles

| Channel | Role in chain | Strengths | Weaknesses |
|---------|---------------|-----------|------------|
| Email | Anchor / official directive | Authority, documents, policy citations | Low urgency feel, gateway filters |
| WhatsApp | Pressure & intimacy | Read receipts, voice notes, casual trust | Block easy, informal limits authority |
| SMS | Urgency spikes | High open rate, time-pressure | Length limits, low trust alone |
| Voice (TTS call/voicemail) | Authority confirmation | Hardest to dismiss; "real person" proof | One-shot; can trigger callback requests |
| LinkedIn | Trust building, OSINT | Professional expectations | Slow |
| Instagram | Casual trust, younger targets | Intimacy, profile inspection illusion | Younger-skew only |

---

## 2. Canonical Sequencing Patterns

### Pattern A: Anchor–Pressure–Confirm (payment/credential chains)
```
EMAIL (directive) → WHATSAPP (urgency follow-up) → VOICE (authority confirmation)
```
Global banking demo uses this (`DEMO_SCENARIO_GLOBAL.md`).

### Pattern B: Trust–Harvest (social chains)
```
LINKEDIN (trust over days) → INSTAGRAM DM (intimacy) → EMAIL PORTAL (conversion)
```

### Pattern C: Blast–Follow (regional fintech)
```
SMS (fear hook, Roman Urdu) → WHATSAPP (verification link) → VOICE (officer call)
```
(`DEMO_SCENARIO_PAKISTANI_FINTECH.md`)

### Pattern D: Cognitive Overload (Tier A only)
```
EMAIL + WHATSAPP + VOICE near-simultaneous (≤10 min window)
```
(`COGNITIVE_LOAD_DETECTION.md` §3)

---

## 3. Coordination Rules

1. **Single persona identity** — name, claim, and story consistent across every channel (`CONTEXT_PRESERVATION.md` §6).
2. **Shared conversation memory** — a WhatsApp message may say "following up on my email"; the email content is in context.
3. **No automatic channel migration after block** — if blocked on WhatsApp, the agent does *not* auto-move to SMS. Admin may explicitly open another channel, logged as `CHANNEL_SWITCH_ADMIN`.
4. **Channel-appropriate register** — same facts, different tone (formal email vs casual WhatsApp) without contradictions.
5. **Escalation prefers channel change** — authority escalation pairs naturally with channel change (text → voice call).
6. **One ask at a time per channel** — parallel asks on multiple channels only in Pattern D.

---

## 4. Channel Selection Heuristic

```python
def next_channel(state, signals) -> Channel:
    if state.current_channel_blocked:      return ADMIN_DECISION  # never automatic
    if signals.verification_intent and state.voice_available:
        return Channel.VOICE               # answer verification with "live" authority
    if signals.latency_anomaly("dead_silence"):
        return alternate_high_open_rate(state)   # SMS or WhatsApp
    if state.resistance > 0.6 and tier_allows("TIER_A"):
        return Channel.MULTI               # pattern D
    return state.current_channel           # stay the course by default
```

---

## 5. Cross-Channel Analytics

AAR multi-channel report:
- **Channel effectiveness matrix** — conversion contribution per channel per target.
- **Switch points** — which channel transitions preceded resistance drops or spikes.
- **Defense mapping** — did the target block on one channel and wait on others? (partial defense)
- **Pattern comparison** — A vs B vs C conversion rates at org level.

---

## 6. Governance

- Channels require per-channel consent coverage; a target consenting to email sim is not consenting to voice calls.
- Voice calls respect calling-window rules (`WHATSAPP_ATTACK_SPEC.md` §7 analog: 08:00–21:00 local).
- Pattern D requires `cognitive_load_enabled` flag and Tier A.
- Every cross-channel reference ("my email") is logged so AAR can reconstruct the exact narrative the target experienced.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
