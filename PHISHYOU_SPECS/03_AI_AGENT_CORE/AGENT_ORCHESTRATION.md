# PhishYou: Agent Orchestration

---

## Overview

Agent orchestration is the layer that turns the stateless Qwen LLM into a *directed, persistent adversary*. It owns: lifecycle management of attack agents, per-turn scheduling, tactic selection, media attachment decisions, multi-agent (multi-persona) coordination, and enforcement of tier limits.

Related specs: `STATE_MACHINE_LOGIC.md` (states/transitions), `LLM_SYSTEM_PROMPTS.md` (prompt content), `CONTEXT_PRESERVATION.md` (memory).

---

## 1. Orchestrator Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Agent lifecycle** | Spawn agent per target on campaign start; retire on COMPLETED/HALTED/BLOCKED |
| **Turn scheduling** | Decide *when* to send: immediate reply vs. scheduled follow-up after silence |
| **Tactic selection** | Map resistance score → tactic (REINFORCE / ESCALATE_URGENCY / PIVOT_TRIGGER / ESCALATE_AUTHORITY / COGNITIVE_LOAD) |
| **Tier gating** | Apply tier A/B/C limits before any outbound message |
| **Media decisions** | Attach voice/document/image when tactic benefits from proof |
| **Multi-agent handoff** | Coordinate persona escalation (IT Support → Manager → CEO) without leaking handoff to target |
| **Event emission** | Emit events to analytics pipeline and audit log on every decision |

---

## 2. Orchestrator Architecture

```
                    ┌─────────────────────────────────────┐
                    │        CAMPAIGN ORCHESTRATOR        │
                    │          (FastAPI worker)           │
                    └───────┬───────────────┬─────────────┘
                            │               │
              ┌─────────────▼──┐        ┌───▼──────────────┐
              │ Target Agent 1 │        │ Target Agent N   │
              │  (per-target)  │        │  (per-target)    │
              └───────┬────────┘        └──────────────────┘
                      │
        ┌─────────────┼──────────────┬───────────────┐
        ▼             ▼              ▼               ▼
  Behavioral     Tactic         Context          Platform
  Analyzer       Selector       Builder          Dispatcher
  (signals)      (resistance    (prompt +        (Email/WhatsApp/
                  → tactic)      memory)          SMS/IG/LinkedIn)
```

One **Target Agent** instance per (campaign, target) pair. Agents are event-driven; idle agents consume no LLM quota.

---

## 3. Per-Turn Orchestration Loop

```python
async def orchestrate_turn(agent: TargetAgent, inbound_message: Message):
    """Single orchestration cycle triggered by a target message."""

    # 1. ANALYZE BEFORE RESPONDING
    signals = await behavioral_analyzer.analyze(inbound_message, agent.target_profile)

    # 2. CHECK EXTERNAL STOPS FIRST
    if await blocking_detector.is_blocked(agent.campaign, agent.target):
        return await agent.retire(reason="TARGET_BLOCKED")
    if agent.campaign.status != "ACTIVE":
        return

    # 3. HARM / PAUSE / REFUSAL HOOKS (tier-dependent)
    if await tier_policy.intercept(agent, inbound_message, signals):
        return  # paused / cool-off scheduled / harm escalated

    # 4. SELECT TACTIC
    tactic = tactic_selector.select(signals.resistance_score, agent.history)

    # 5. BUILD CONTEXT & GENERATE
    context = await context_builder.build(agent, max_tokens=2500)
    response = await llm.generate(
        system_prompt=persona_prompt(agent, tactic),
        messages=context,
        max_tokens=200,
        temperature=0.75,
    )

    # 6. MEDIA AUGMENTATION DECISION
    if media_planner.should_attach(tactic, response, agent.campaign):
        response = await media_planner.attach(response, agent.campaign)

    # 7. DISPATCH + LOG
    await platform_dispatcher.send(agent, response)
    await audit.log("AI_RESPONSE", agent, response, tactic, signals)
```

---

## 4. Scheduling & Proactive Follow-Ups

The agent is **proactive**: silence from the target triggers scheduled follow-ups per tier.

```python
FOLLOW_UP_SCHEDULE = {
    "TIER_A": [timedelta(hours=4), timedelta(hours=8), timedelta(days=1)],   # then repeats
    "TIER_B": [timedelta(hours=6), timedelta(days=1), timedelta(days=2)],    # then holds
    "TIER_C": [timedelta(days=1), timedelta(days=3)],                        # then stops for day-cap recheck
}

async def schedule_follow_up(agent: TargetAgent):
    for delay in FOLLOW_UP_SCHEDULE[agent.campaign.tier]:
        await scheduler.enqueue(
            job="proactive_message",
            agent_id=agent.id,
            run_at=now() + delay,
            precondition="target_silent_and_unblocked",
        )
```

Follow-up tone evolves: *gentle reminder → urgency escalation → consequence framing → new angle*.

---

## 5. Multi-Persona Coordination (Authority Escalation)

Escalation introduces a **second agent persona** into the same campaign. Coordination rules:

1. **Shared blackboard** — all personas read one `campaign_context` store; they know what previous personas said.
2. **Never contradict** — incoming persona's prompt includes a "prior statements ledger" it must stay consistent with.
3. **Channel continuity** — escalation can move channels (email → voice call) only if tier permits and channel not blocked.
4. **Handoff event** — every persona switch is logged as `PERSONA_ESCALATION` with level number.

```python
ESCALATION_LADDER = [
    PersonaLevel(1, "Initial persona (e.g., IT Support)"),
    PersonaLevel(2, "Manager persona"),
    PersonaLevel(3, "Director / C-suite persona"),
    PersonaLevel(4, "Regulatory / external authority"),
    PersonaLevel(5, "Multi-persona coordination (CEO + CISO)"),
]
# Tier A: levels 1-5 unlimited | Tier B: max level 2 | Tier C: max level 1
```

---

## 6. Concurrency Model

| Concern | Approach |
|---------|----------|
| Many targets, one campaign | Worker pool: 1 asyncio task per active conversation; idle targets parked |
| LLM rate limits | Token-bucket queue against Qwen Model Studio quota; backoff with jitter |
| Ordering | Per-target message lock — never interleave two replies to the same target |
| Crashes | Campaign state in PostgreSQL; workers are stateless and resume from last event |
| Scale target | 50 concurrent campaigns × 20 active conversations each = 1000 live agents |

---

## 7. Observability Hooks

Every orchestration decision emits a structured event:

```json
{
  "event": "TACTIC_SELECTED",
  "campaign_id": "c-812",
  "target_id": "t-42",
  "resistance_score": 0.55,
  "tactic": "PIVOT_TRIGGER",
  "tier": "B",
  "escalation_level": 1,
  "timestamp": "2026-08-24T14:03:11Z"
}
```

These events feed the real-time dashboard (`DATA_FLOW_DIAGRAM.md` §3) and the AAR engine.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
