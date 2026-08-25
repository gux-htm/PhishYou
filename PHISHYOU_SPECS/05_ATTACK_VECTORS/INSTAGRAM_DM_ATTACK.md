# PhishYou: Instagram DM Attack Spec

---

## Overview

Instagram DM attacks model the casual-social vector: trust built through a plausible profile, friendly DMs, and eventual off-platform movement to a credential portal. Primary personas: P-05 (Recruiter) and P-04-style casual contacts. Typical chains: CHAIN-3 (Recruiter Harvest) and cross-platform handoffs from LinkedIn.

---

## 1. Account & Profile Construction

| Element | Implementation |
|---------|----------------|
| Account | Org-provisioned simulation account (Meta sandbox/partner program); never a hacked or bought account |
| Handle | Persona-consistent (e.g., `@talent.sara.bigtech`) |
| Avatar | Stable Diffusion synthetic headshot |
| Bio | Role + company claim + link to simulation domain |
| Feed | 6–9 pre-generated plausible posts (industry content, office shots) so profile doesn't look fresh |
| Follower graph | Seeded with other simulation accounts for plausibility |

**Hard rules:** no scraping or following real employees outside consented targets; no engagement bait (likes/comments) on target's real content unless OSINT policy for the campaign permits read-only context use.

---

## 2. DM Conversation Design

Tone: very casual, friendly, emoji-natural. Trust built over minimum **3 messages** before any ask (per PRD Use Case 3 data: gradual approach ~70% vs immediate ask ~10%).

```
Message 1 (Hook):      "Hey {first_name}! Saw your work on {project/skill} — really impressive 👏"
Message 2 (Bridge):    "We're hiring for {role} at {company}. Your background is a great match. Open to a quick chat?"
Message 3 (Social):    Light industry talk; reference plausible shared context
Message 4 (The Ask):   "Interview platform link sent — log in with your LinkedIn/Gmail to confirm slot"
```

**Objection handling:**
| Objection | Response pattern |
|-----------|------------------|
| "Is this legit?" | Share profile, tag colleagues (sim accounts), reference public company facts |
| "Why Instagram?" | "Recruiting team uses IG for initial outreach; formal steps go through the platform" |
| "Send me an email instead" | Pivot to email channel with same persona (multi-channel continuity) |

---

## 3. Off-Platform Movement

The conversion event is moving the target to a **fake interview/verification portal**:

1. Portal mimics a known interview scheduling product (branded clone).
2. Login page requests LinkedIn or Gmail OAuth — simulated consent screen captures "granted: yes/no" only.
3. Post-login page schedules a fake interview to maintain illusion.
4. Portal lifecycle and capture rules identical to `EMAIL_SPOOFING.md` §3 (hashed discard, auto-takedown).

---

## 4. Cross-Platform Coordination

Instagram rarely works alone. Standard coordination (`MULTI_CHANNEL_ORCHESTRATION.md`):

```
LinkedIn connection/DM ──(trust built)──▶ Instagram DM follow-up ──▶ Email portal link
```

- Same persona identity across channels (name, avatar, company claim).
- Conversation memory shared; Instagram opener references the LinkedIn exchange.
- If target blocks on one platform, no automatic migration to the other — admin decision only.

---

## 5. Detection Metrics Tracked

| Metric | Value |
|--------|-------|
| Profile inspection | Did target visit the persona profile before replying? (via portal/profile telemetry where platform exposes it) |
| Reply latency | Casual channel baseline differs from email — separate timing baseline |
| Link click vs login | Two-stage funnel: click-through rate and credential-entry rate reported separately |
| Cross-check behavior | Target asking for LinkedIn/email of persona = verification attempt (RESISTANCE signal) |

---

## 6. Governance Constraints

- DM campaigns require target consent category covering *social platforms* explicitly (some employees consent to email/sim but not social).
- No romantic/flirtatious framing (sextortion patterns excluded entirely from platform).
- No paid promotion or ads; only direct DM to consented targets.
- Campaign accounts wiped at campaign end; no persistent fake social presence.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
