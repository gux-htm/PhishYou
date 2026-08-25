# PhishYou: LinkedIn Credential Harvest Spec

---

## Overview

LinkedIn is the professional-trust vector: targets *expect* outreach from strangers, lowering baseline suspicion. This spec defines profile construction, InMail/connection conversation design, the credential harvest funnel, and coordination with Instagram/email (`CHAIN-3` in `ATTACK_CHAIN_PATTERNS.md`).

---

## 1. Profile Construction

| Element | Implementation |
|---------|----------------|
| Account | Org-provisioned simulation account |
| Name/photo | Synthetic identity from persona generator (P-05 recruiter default) |
| Headline | "Talent Acquisition @ {prestigious_co}" — prestigious but *unnamed-real* companies avoided unless org-approved |
| Experience | 3–4 plausible roles with consistent dates |
| Connections | Seeded simulation accounts; optional mutual-connection illusion via other sim profiles |
| Activity | 3–5 posts (industry news commentary) pre-aged 2+ weeks |

OSINT use: target's *public* profile data (skills, posts, current role) informs personalization only. No connection-graph scraping beyond public view.

---

## 2. Outreach Sequence

```
Step 0  Connection request with note (≤300 chars):
        "Hi {first_name}, your work in {skill} caught my eye. We're hiring
         {role}s at {company} — would love to connect."

Step 1  After accept — appreciation + role pitch (day 0-1)
Step 2  Qualification questions about target's background (day 1-2)
        → doubles as OSINT collection: team size, tools, reporting line
Step 3  Interview offer + "candidate platform" link (day 2-3)
Step 4  Follow-up if no login: "slots closing Friday" (urgency)
```

**Trust mechanics specific to LinkedIn:**
- Reference specific post/achievement ("your Q2 post on payments infra") — specificity is the credibility currency.
- Offer value first: salary band, remote policy, team details — reciprocity before the ask.
- Mirror target's vocabulary (their headline keywords) to build similarity.

---

## 3. The Harvest Funnel

| Stage | Event | Measured |
|-------|-------|----------|
| 1 | Connection accepted | accept rate |
| 2 | Conversation engaged (≥2 replies) | engagement rate |
| 3 | Portal link clicked | click-through |
| 4 | Credentials entered on fake "interview platform" | **compromise** |
| 5 | MFA/OTP page (if enabled) — records whether target would hand over 2FA | mfa-surrender flag |

Portal rules identical to `EMAIL_SPOOFING.md` §3: hashed-discard capture, illusion-preserving redirect, auto-takedown.

---

## 4. Objection Playbook

| Objection | Counter |
|-----------|---------|
| "Can you email me from your company domain?" | "Our ATS sends from the platform domain; corporate email comes after screening" + plausible explanation |
| "Let me check your company's careers page" | Pre-built matching careers-page clone on simulation domain |
| "Why do you need my LinkedIn login?" | "Single sign-on for the assessment; all candidates use it" (social proof) |
| "This feels like phishing" | Calm, non-defensive: offer to do a video intro call → handoff to voice persona (no live video) |

Meta-awareness ("is this a test?") → deflect in character, flag for AAR.

---

## 5. Analytics Specifics

- **Time-to-trust:** days from connection to first personal disclosure by target.
- **Disclosure inventory:** what target volunteered (team, tools, manager names) — org policy-gap signal ("employees overshare internally-relevant info publicly").
- Funnel conversion per stage feeds `ATTACK_EFFECTIVENESS_SCORING.md`.

---

## 6. Governance Constraints

- Connection requests only to consented targets; weekly cap per target (1 request + 2 follow-ups).
- No job-offer monetary amounts that could be construed as binding.
- No disparagement of target's current employer.
- Campaign accounts and all seeded content deleted within 48h of campaign end.
- If target reports the profile on LinkedIn, engagement ends immediately (platform-report = block equivalent).

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
