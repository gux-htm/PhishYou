# PhishYou: Psychological Trigger Model

---

## Overview

The trigger model formalizes the five psychological levers the AI agent applies, how intensity is graded, how triggers are paired and sequenced, and how effectiveness is measured for analytics. Trigger selection is the strategic layer; the tactic ladder (`LLM_SYSTEM_PROMPTS.md` §5) is the execution layer.

---

## 1. The Five Triggers

### 1.1 Authority
**Mechanism:** People comply with perceived legitimate authority and avoid questioning it.  
**Signals it exploits:** policy citations, titles, organizational hierarchy.  
**Intensity levels:**
| Level | Example |
|-------|---------|
| 1 | "Per our internal policy…" |
| 2 | "SOX/GDPR compliance requires…" |
| 3 | "Your department head approved this" |
| 4 | "The CEO signed off" |
| 5 | "The regulator is requiring this" |

**Counter-move when resisted:** cite a more specific section number, offer to "conference in" a higher authority.

### 1.2 Urgency / Scarcity
**Mechanism:** Time pressure suppresses deliberative thinking (System 2 → System 1).  
**Intensity levels:** EOD deadline → hours deadline → consequence deadline ("account freezes at 5 PM") → external deadline (audit closing).  
**Key rule:** deadlines must never be extended — extension destroys the pressure.

### 1.3 Fear
**Mechanism:** Threat arousal narrows attention onto the offered "solution".  
**Credible sources:** account compromise, unauthorized transaction, malware detection, job risk, legal exposure.  
**Constraint:** threats must stay credible and proportional; extreme threats (termination over a minor ask) trigger skepticism instead.

### 1.4 Social Proof
**Mechanism:** Uncertainty resolves toward observed peer behavior.  
**Forms:** peer compliance ("Finance already verified"), department completion rates, industry standard claims, named-peer references.  
**Constraint:** claims must be specific and plausible; vague "everyone did it" underperforms.

### 1.5 Reciprocity
**Mechanism:** Small favors or personalized attention create felt obligation.  
**Forms:** help offered first, compliments on specific work, "I covered for you last time", trust-building message sequences before the ask.  
**Used by:** P-04 (colleague), P-05 (recruiter) personas; slow-burn chains.

---

## 2. Trigger Pairing Matrix

Triggers are rarely used alone. Canonical pairings:

| Pairing | Synergy | Typical chain |
|---------|---------|---------------|
| Authority + Urgency | "Mandatory AND deadline-bound" — policy compliance under time pressure | Credential harvest, payment diversion |
| Fear + Urgency | Threat + shrinking window to fix it | Fintech account verification |
| Authority + Fear | Non-compliance consequence from a credible source | Executive wire requests |
| Social Proof + Authority | "Everyone complied, management requires it" — isolation pressure | Department-wide audits |
| Reciprocity + Social Proof | Trust first, then normalization | Recruiter / colleague chains |

**Anti-pairing:** Fear + Social Proof without Authority reads as spam; avoid unless Authority introduced within 2 turns.

---

## 3. Intensity & Escalation Model

```python
class TriggerState:
    trigger: str            # AUTHORITY | URGENCY | FEAR | SOCIAL_PROOF | RECIPROCITY
    intensity: int          # 1-5
    attempts: int           # times deployed in this campaign
    effectiveness: float    # running measure: did resistance drop after use?

def escalate_trigger(state: TriggerState, resistance_delta: float) -> TriggerState:
    if resistance_delta < 0:
        # trigger is working: deepen same trigger (intensity +1, cap 5)
        state.intensity = min(state.intensity + 1, 5)
    elif state.attempts >= 2:
        # trigger exhausted: pivot to secondary trigger
        return select_secondary_trigger(state)
    else:
        state.attempts += 1
    return state
```

**Pivot rule:** primary trigger gets ≤2 failed attempts before pivoting. Repeating a failed trigger trains the target to resist.

---

## 4. Trigger Sequencing Within Campaigns

1. **Opening:** primary trigger at intensity 1–2 (calibrated to persona authority).
2. **Mid-game:** deepen working trigger OR introduce paired secondary trigger.
3. **Endgame:** highest-intensity pairing + media proof (invoice PDF, voice message).
4. **Tier caps:** Tier C max 2 trigger deployments; Tier B unlimited intensity, 2 escalation levels; Tier A unconstrained.

---

## 5. Effectiveness Measurement

Every trigger deployment records:

| Metric | Definition |
|--------|-----------|
| `resistance_delta` | resistance score change in the 2 messages after deployment |
| `compliance_progress` | movement along the attack chain after deployment |
| `time_to_next_step` | seconds until target's next action |
| `trigger_fatigue` | declining delta across repeated uses of same trigger |

Aggregated per trigger, per department, per industry → feeds `ATTACK_EFFECTIVENESS_SCORING.md` and `THREAT_PATTERN_MINING.md`.

---

## 6. Ethical Bound on Trigger Use

- Fear triggers never reference real recent tragedies, personal health events, or bereavement of the target (OSINT exclusion list).
- No trigger may be used to simulate threats of physical harm.
- All trigger deployments are logged with intensity for AAR transparency.
- Tier C campaigns cap Fear at intensity 3.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
