# PhishYou: Timing Pattern Detection

---

## Overview

*When* a target replies is as revealing as *what* they reply. Timing analysis builds a per-target baseline, flags anomalies, identifies the hours when the target is most vulnerable, and feeds both the resistance score (weight 0.20) and the send-time scheduler.

---

## 1. Baseline Construction

```python
class TimingBaseline:
    avg_response_time: float        # rolling mean, seconds
    std_response_time: float        # rolling std dev
    response_by_hour: dict[int, float]   # avg latency per hour-of-day
    active_window: tuple[int, int]  # typical first/last message hour
    sample_count: int               # messages observed

    @staticmethod
    def update(baseline, observed_latency):
        # rolling stats over last 20 messages, min 5 samples before anomalies count
        ...
```

- Baseline starts after **5 observed replies**; before that, latency signals are suppressed (cold-start guard).
- Separate baselines per platform (people reply to WhatsApp faster than email).

---

## 2. Anomaly Signals

| Signal | Detection | Resistance contribution |
|--------|-----------|------------------------|
| **Latency spike** | latency > baseline_mean + 2σ | +0.5 (checking with someone / researching) |
| **Gradual slowdown** | 3 consecutive replies each slower than the last | +0.4 (growing disengagement) |
| **Sudden speed-up** | latency < baseline_mean − 1.5σ after slow phase | 0.0 but flagged: urgency landed OR target preparing trap |
| **Dead silence** | no reply > 24h after direct question | +0.6 (avoidance / reported) |
| **Off-hours reply** | reply outside active_window | informational: stress or unusual attention |

```python
def latency_anomaly(history, baseline) -> float:
    if baseline.sample_count < 5:
        return 0.0
    last = history[-1].latency
    z = (last - baseline.avg_response_time) / max(baseline.std_response_time, 1)
    if z >= 2:    return 0.5    # spike
    if gradually_slowing(history): return 0.4
    if silence_duration(history) > timedelta(hours=24): return 0.6
    return 0.0
```

---

## 3. Vulnerability Windows (Offensive Use)

Timing also tells the agent **when to strike**:

```python
def optimal_send_time(baseline, campaign) -> datetime:
    candidates = [
        Window("late_afternoon", 15, 17),   # decision fatigue peak (see FATIGUE_EXPLOITATION.md)
        Window("month_end", None, None),    # if OSINT flags high-stress period
        Window("after_silence", None, None) # immediately after target returns from gap
    ]
    return pick_when_target_most_active(candidates, baseline.response_by_hour)
```

Rules:
- Tier A: scheduling may exploit late-evening hours (20:00–22:00) when deliberation is weaker.
- Tier C: sends restricted to 09:00–18:00 local time of target.
- Urgency deadlines are set relative to target's active window, not sender clock.

---

## 4. Cross-Channel Timing Correlation

Multi-channel campaigns log per-channel response order:

| Pattern | Reading |
|---------|---------|
| Answers WhatsApp instantly, ignores email | Mobile-first target: escalate on WhatsApp |
| Responds to voice call, delays texts | Authority-sensitive; voice is the leverage channel |
| Replies to all channels simultaneously | High vigilance; possible security-aware target |

Channel-latency deltas feed `MULTI_CHANNEL_ORCHESTRATION.md` channel-selection heuristics.

---

## 5. Analytics Outputs

For the AAR timeline:
- Latency series chart aligned with AI messages (which AI message made them stall?)
- Time-to-first-reply per escalation level
- Longest stall and what preceded it (often the strongest resistance moment)

---

## 6. Constraints

- Timezones stored in UTC; all local-time logic uses target timezone.
- Baselines reset per campaign (people's rhythms change); cross-campaign carryover is aggregates only.
- Timing data is behavioral metadata — retained 2 years like other analytics, not subject to the 90-day content retention.

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
