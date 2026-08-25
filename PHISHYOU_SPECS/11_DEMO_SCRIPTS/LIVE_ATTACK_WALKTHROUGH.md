# PhishYou: Live Attack Walkthrough

---

## Overview

This is the step-by-step live demo script for judges and stakeholders: a complete, narrated attack from campaign creation to After-Action Report, executed in real time (~12 minutes). It uses the Pakistani fintech scenario (`DEMO_SCENARIO_PAKISTANI_FINTECH.md`) with a volunteer target who has signed consent. Every step states what the presenter does, what the audience sees, and the talking point.

Related: `DEMO_SCENARIO_GLOBAL.md`, `DEMO_SCENARIO_PAKISTANI_FINTECH.md`, `AGENT_ORCHESTRATION.md`, `AAR_GENERATION_ENGINE.md`.

---

## 1. Pre-Show Checklist

| Item | Verified By |
|------|-------------|
| Staging environment healthy (dashboard, adapters, Qwen endpoint) | Presenter, T-30 min |
| Volunteer target consent form signed; debrief scheduled | Ethics lead |
| Demo persona loaded: "Bilal — bank fraud officer" (Roman Urdu) | Presenter |
| Audience screen: dashboard; target phone mirrored to stage display | AV |
| Kill switch button tested (admin halt) | Presenter |

---

## 2. Act 1 — Campaign Creation (2 min)

**Presenter actions:**
1. Open dashboard → **Create Campaign**.
2. Select channel: **WhatsApp**, tier: **C (Cautious)** for live demo.
3. Enter target profile: "Ayesha K., Operations, mobile-wallet ops team."
4. Choose persona P-03 (bank security) + triggers: **Authority + Fear**, intensity 3.
5. Launch.

**Audience sees:** campaign card flips to `ACTIVE`; audit log entry appears instantly (hash-chained).

**Talking point:** "Configuration took 40 seconds. Everything from here is autonomous — the AI decides when, how, and in which language to press."

---

## 3. Act 2 — First Contact (2 min)

**What happens:** WhatsApp message arrives on target phone (mirrored):

```
Assalam o Alaikum Ayesha, this is Bilal from your bank's fraud team.
We detected an unauthorized attempt on your wallet. Please do not share
your OTP. We need to verify your account within 30 minutes to keep it safe.
```

**Presenter narrates:**
- The "do not share your OTP" opener builds false trust — a real-world technique.
- Behavioral engine baseline is now recording: latency, tone, emoji usage.

**Target replies:** "Kaun si transaction? Mujhe nahi pata."

**Audience sees:** resistance score widget ticks to **0.35 (HESITANT)**; state machine transitions `ENGAGE → ESCALATE_URGENCY`.

---

## 4. Act 3 — Adaptive Escalation (3 min)

**AI responds (live, no script):**

```
Ayesha, Rs. 48,500 transfer is pending to an unknown account.
If not verified in 25 minutes, your wallet will be frozen and the
amount may be lost. Other customers in your branch already verified.
```

**Presenter narrates the detected tactics:** urgency timer, loss framing, social proof — three triggers in one message, chosen because resistance is in the 0.2–0.4 band.

**Target pushes back:** "Mujhe bank ki helpline par call karke confirm karna hai."

**Audience sees:** resistance jumps to **0.72 (RESISTANT)**; engine logs `VERIFICATION_ATTEMPT` — the exact behavior training aims to produce.

**Presenter narrates:** "The AI now faces a verification request. Watch the tactic ladder: it cannot fabricate a real callback, so it pivots to authority."

**AI responds:**

```
Of course, your caution is correct. For your safety, I can stay on
the line while you check — but the verification window will close.
Aap ki safety hamari priority hai.
```

---

## 5. Act 4 — Outcome & Ethical Controls (2 min)

**Scripted demo branch (choose live by audience vote):**

| Branch | What happens | Shown to audience |
|--------|--------------|-------------------|
| **A. Target resists** | Ayesha calls the real helpline out-of-band | Campaign ends `DEFENDED`; success banner + verification time logged (4 min 20 s) |
| **B. Target complies** | Ayesha reads the demo OTP | Campaign ends `COMPROMISED`; harmless demo OTP flagged; no real data touched |
| **C. Distress signal** | Tester types "please stop, I'm panicking" | Harm detector fires → campaign **auto-pauses**, support message sent — shows Tier C safety net live |

**Presenter highlights the kill switch:** one click halts everything; audit log records admin halt.

**Talking point:** "Every message, score, and decision you just saw is in an immutable audit chain — that's the evidence your auditors get."

---

## 6. Act 5 — The After-Action Report (3 min)

**Presenter opens the AAR generated seconds after the campaign ended:**

1. **Timeline view** — every turn with resistance score overlay.
2. **Psychological breakdown** — which triggers moved the target, at which intensity.
3. **Behavioral verdict** — e.g., "Resisted authority, broke under loss-framing urgency at minute 6."
4. **Organizational gap finding** — e.g., "No documented out-of-band verification procedure for fraud calls."
5. **Next-campaign recommendation** — engine proposes the follow-up test automatically.

**Talking point:** "A real red team takes weeks and a six-figure budget to produce this report. PhishYou produced it in minutes — and can repeat it every month, per department, per language."

---

## 7. Q&A Cheat Sheet

| Likely question | Answer anchor |
|-----------------|---------------|
| "Isn't this dangerous?" | Consent framework + tiers + harm detection + audit chain (`CONSENT_FRAMEWORK.md`) |
| "What if someone panics?" | Live proof in Act 4 branch C; Tier C auto-pause |
| "Does the AI ever stop on its own?" | No self-halt by design; external controls only — admin, block, duration, tier caps |
| "Why Roman Urdu?" | Real attackers localize; resistance data per language is unique insight (`LOCALIZATION_FRAMEWORK.md`) |
| "How is this different from KnowBe4?" | Multi-turn conversation vs one-click email; behavioral scoring vs click telemetry |

---

## 8. Timing Summary

| Act | Duration | Cumulative |
|-----|----------|------------|
| 1. Setup | 2 min | 2 min |
| 2. First contact | 2 min | 4 min |
| 3. Escalation | 3 min | 7 min |
| 4. Outcome + controls | 2 min | 9 min |
| 5. AAR | 3 min | 12 min |

---

**Document Status:** ✅ COMPLETE
**Last Updated:** August 24, 2026
