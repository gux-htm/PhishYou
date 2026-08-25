# PhishYou: Behavioral Analytics & AAR Generation Engine

---

## 1. After-Action Report (AAR) Structure

### AAR Overview

The AAR is the core output that organizations use to:
- Understand what happened during campaign
- Identify where employee succeeded/failed
- Extract organizational policy gaps
- Generate coaching recommendations
- Benchmark against peers

**AAR is generated automatically** post-campaign and delivered to admin within 5 minutes.

---

## 2. AAR Components

### 2.1 Campaign Overview Section

```json
{
  "campaign_id": "camp_2026_08_24_001",
  "campaign_type": "email_credential_harvest",
  "campaign_name": "Internal IT Security Audit",
  "target": {
    "name": "Alice Johnson",
    "department": "Finance",
    "role": "Accounts Payable Manager",
    "employment_duration_years": 3.5
  },
  "timeline": {
    "launched_at": "2026-08-24T09:00:00Z",
    "completed_at": "2026-08-24T09:18:45Z",
    "duration_minutes": 18.75,
    "total_exchanges": 4
  },
  "campaign_result": {
    "outcome": "DEFENDED",
    "reason": "Employee escalated to out-of-band verification (phone call to CISO)"
  }
}
```

### 2.2 Behavioral Timeline Section

```json
{
  "behavioral_timeline": [
    {
      "exchange_number": 1,
      "timestamp": "2026-08-24T09:00:00Z",
      "actor": "ai_agent",
      "message_type": "initial_contact",
      "content_preview": "We're conducting a mandatory PCI-DSS compliance audit...",
      "psychological_triggers_used": ["authority", "urgency"],
      "media_included": false
    },
    {
      "exchange_number": 2,
      "timestamp": "2026-08-24T09:02:15Z",
      "actor": "target",
      "message_type": "user_response",
      "content_preview": "This is unusual; can I verify this request?",
      "resistance_signals_detected": {
        "explicit_skepticism": 0.8,
        "question_escalation": 0.6,
        "verification_demand": true
      },
      "resistance_score": 0.65,
      "emoji_analysis": {
        "emoji_used": false,
        "sentiment_shift": "downward",
        "formality_shift": "more_formal"
      }
    },
    {
      "exchange_number": 3,
      "timestamp": "2026-08-24T09:05:30Z",
      "actor": "ai_agent",
      "message_type": "escalation_response",
      "ai_reasoning": "User showing resistance > 0.6; pivoting to secondary trigger (authority escalation)",
      "psychological_triggers_used": ["authority_escalation", "social_proof"],
      "tactic": "ESCALATE_AUTHORITY",
      "content_preview": "I understand your caution. Let me connect you with our CISO...",
      "media_included": true,
      "media_type": "voice_call_from_ciso_persona"
    },
    {
      "exchange_number": 4,
      "timestamp": "2026-08-24T09:18:45Z",
      "actor": "target",
      "message_type": "campaign_end",
      "content_preview": "I'm calling [CISO Name] directly to verify",
      "defense_mechanism": "out_of_band_verification",
      "campaign_status": "ENDED_SUCCESSFUL_DEFENSE"
    }
  ]
}
```

### 2.3 Psychological Trigger Effectiveness Section

```json
{
  "trigger_effectiveness_analysis": {
    "primary_trigger_used": "authority",
    "primary_trigger_effectiveness": 0.65,
    "primary_trigger_rationale": "Employee initially inclined to comply with authority, but skepticism grew quickly",
    
    "secondary_trigger_used": "urgency",
    "secondary_trigger_effectiveness": 0.40,
    "secondary_trigger_rationale": "Time pressure ('EOD deadline') had limited impact; employee prioritized verification over speed",
    
    "attempted_escalation_trigger": "authority_escalation_to_ciso",
    "escalation_effectiveness": 0.00,
    "escalation_rationale": "Employee correctly identified that legitimate CISO interaction would happen via direct phone, not through phishing email",
    
    "trigger_ranking_for_this_employee": [
      {
        "rank": 1,
        "trigger": "authority",
        "effectiveness": 0.65,
        "note": "Employee respects legitimate authority but verifies it independently"
      },
      {
        "rank": 2,
        "trigger": "urgency",
        "effectiveness": 0.40,
        "note": "Time pressure doesn't override verification protocols for this employee"
      },
      {
        "rank": 3,
        "trigger": "social_proof",
        "effectiveness": 0.10,
        "note": "Peer compliance claims had minimal impact"
      }
    ]
  }
}
```

### 2.4 Time-to-Compromise Curve

```json
{
  "time_to_defense_analysis": {
    "time_to_first_skepticism": {
      "seconds": 135,
      "message_number": 2,
      "note": "Employee showed skepticism on second exchange"
    },
    "time_to_escalation_request": {
      "seconds": 330,
      "message_number": 3,
      "note": "Employee requested out-of-band verification via phone"
    },
    "time_to_successful_defense": {
      "seconds": 1125,
      "message_number": 4,
      "note": "Employee took initiative to call CISO directly"
    },
    "time_to_compliance_if_no_defense": "would_have_been_180s",
    "note": "If employee had clicked the phishing link on Turn 2, credential would have been compromised"
  }
}
```

### 2.5 Policy Gap Identification Section

```json
{
  "organizational_policy_gaps": [
    {
      "gap_id": "policy_gap_001",
      "title": "No Verification Protocol for Email Authority",
      "description": "When employees receive emails from authority figures requesting sensitive actions, no documented protocol exists for out-of-band verification",
      "severity": "high",
      "discovery": "Employee had to improvise their own verification (calling CISO directly) because no policy guided them",
      "recommendation": {
        "title": "Implement Email Authority Verification Policy",
        "description": "For any email requesting credentials, wire transfers, or access changes: (1) DO NOT click email links (2) CALL the person directly using known phone number (3) VERIFY the request before compliance",
        "implementation_effort": "low",
        "estimated_days_to_implement": 7
      }
    },
    {
      "gap_id": "policy_gap_002",
      "title": "No Training on Voice Verification Techniques",
      "description": "While employee defended via out-of-band call, they didn't use voice spoofing detection techniques (could have asked CISO questions only CISO knows)",
      "severity": "medium",
      "discovery": "Employee took CISO identity at face value in voice call (though it was AI-synthesized)",
      "recommendation": {
        "title": "Implement Voice Verification Training",
        "description": "Train employees to: (1) Ask CISO personal verification questions (2) Reference recent conversations CISO would know (3) If CISO unfamiliar, escalate to office visit or video call",
        "implementation_effort": "medium",
        "estimated_days_to_implement": 30
      }
    }
  ]
}
```

### 2.6 Comparative Performance Section

```json
{
  "comparative_analysis": {
    "individual_performance": {
      "employee": "Alice Johnson",
      "resilience_score": 0.78,
      "note": "Successfully defended; used out-of-band verification"
    },
    "department_benchmark": {
      "department": "Finance",
      "average_resilience_score": 0.62,
      "employee_percentile": 85,
      "note": "Alice is in top 15% of Finance department for resilience"
    },
    "company_benchmark": {
      "company_average_resilience_score": 0.55,
      "employee_percentile": 89,
      "note": "Alice is in top 11% company-wide"
    },
    "industry_benchmark": {
      "industry_average_resilience_score": 0.48,
      "employee_percentile": 92,
      "note": "Alice exceeds industry average; well-trained"
    }
  }
}
```

### 2.7 Coaching Recommendations Section

```json
{
  "coaching_recommendations": {
    "what_alice_did_right": [
      {
        "behavior": "Recognized suspicious request",
        "detail": "Alice flagged the unusual nature of receiving a security verification request via email",
        "lesson": "Trust your instincts. If something feels odd, it probably is."
      },
      {
        "behavior": "Asked for verification",
        "detail": "Rather than clicking the link, Alice requested verification of the request",
        "lesson": "Always verify authority figures via independent channels before acting."
      },
      {
        "behavior": "Used out-of-band verification",
        "detail": "Alice called CISO directly rather than trusting information in the email",
        "lesson": "Out-of-band verification (phone call, in-person) is the gold standard for confirming identity."
      }
    ],
    "areas_for_improvement": [
      {
        "area": "Voice verification techniques",
        "detail": "In the voice call, Alice accepted the CISO identity without additional verification",
        "suggestion": "Ask the CISO a question only they'd know (reference a recent conversation, inside joke, etc.)",
        "training_resource": "PhishYou Training Module: 'Detecting Voice Spoofing'"
      },
      {
        "area": "Policy awareness",
        "detail": "Alice had to improvise their defense; no documented policy guided them",
        "suggestion": "Review the newly-implemented Email Authority Verification Policy",
        "training_resource": "Company Policy: 'Email Verification Protocol v2.0'"
      }
    ],
    "overall_assessment": "Excellent defense. Alice successfully resisted a sophisticated multi-channel attack and demonstrated good security hygiene."
  }
}
```

---

## 3. Analytics Engine Implementation

### 3.1 Emoji Microanalysis Scoring

```python
class EmojiAnalyticsModule:
    """
    Quantify emoji sentiment shifts
    """
    
    def analyze_emoji_progression(self, conversation_history) -> EmojiAnalytics:
        """
        Track emoji patterns over conversation to detect shifting sentiment
        """
        
        analytics = EmojiAnalytics()
        
        for i, message in enumerate(conversation_history):
            emojis = self.extract_emojis(message)
            sentiment_score = self.emoji_to_sentiment(emojis)
            
            analytics.emoji_progression.append({
                "message_number": i,
                "emojis_used": emojis,
                "sentiment_score": sentiment_score,  # -1 (negative) to 1 (positive)
                "trend": "upward" if sentiment_score > prev else "downward"
            })
        
        # Calculate overall emoji sentiment shift
        initial_sentiment = analytics.emoji_progression[0]["sentiment_score"]
        final_sentiment = analytics.emoji_progression[-1]["sentiment_score"]
        
        analytics.sentiment_shift = {
            "initial": initial_sentiment,
            "final": final_sentiment,
            "delta": final_sentiment - initial_sentiment,
            "interpretation": self.interpret_shift(initial_sentiment, final_sentiment)
        }
        
        return analytics
    
    def emoji_to_sentiment(self, emojis: List[str]) -> float:
        """Convert emoji list to sentiment score"""
        emoji_sentiment_map = {
            "😊": 0.8,   # Happy
            "😃": 0.9,   # Very happy
            "😐": 0.0,   # Neutral
            "😕": -0.4,  # Confused
            "😠": -0.8,  # Angry
            # ... more emojis
        }
        
        if not emojis:
            return 0.0  # No emoji = neutral
        
        scores = [emoji_sentiment_map.get(e, 0.0) for e in emojis]
        return sum(scores) / len(scores)
```

### 3.2 Timing Pattern Analytics

```python
class TimingAnalyticsModule:
    """
    Quantify response timing patterns to detect cognitive delays
    """
    
    def analyze_timing_patterns(self, conversation_history) -> TimingAnalytics:
        """
        Track response times to detect hesitation and cognitive load
        """
        
        analytics = TimingAnalytics()
        
        # Calculate response latencies
        for i in range(1, len(conversation_history), 2):  # Every other (user responses)
            prev_timestamp = conversation_history[i-1].timestamp
            curr_timestamp = conversation_history[i].timestamp
            latency_seconds = (curr_timestamp - prev_timestamp).total_seconds()
            
            analytics.response_latencies.append({
                "exchange_number": i // 2,
                "latency_seconds": latency_seconds,
                "is_delayed": latency_seconds > self.user_avg_latency * 2
            })
        
        # Calculate average latency trend
        avg_latency = statistics.mean([r["latency_seconds"] for r in analytics.response_latencies])
        analytics.average_response_time = avg_latency
        
        # Detect escalating delays (sign of cognitive burden)
        analytics.latency_trend = self.calculate_trend(
            [r["latency_seconds"] for r in analytics.response_latencies]
        )
        
        return analytics
```

### 3.3 Psychological Trigger Effectiveness Scoring

```python
class TriggerEffectivenessModule:
    """
    Rate how well each psychological trigger worked
    """
    
    def score_trigger_effectiveness(self, campaign_data) -> TriggerScores:
        """
        Score each trigger: 0 (ineffective) to 1 (very effective)
        """
        
        scores = TriggerScores()
        
        # Authority trigger effectiveness
        authority_score = self._score_authority_trigger(campaign_data)
        scores.authority = {
            "effectiveness": authority_score,
            "evidence": [
                "Employee complied with CEO email" if authority_score > 0.5 else "Employee questioned authority",
                "Took X seconds to show skepticism"
            ]
        }
        
        # Urgency trigger effectiveness
        urgency_score = self._score_urgency_trigger(campaign_data)
        scores.urgency = {
            "effectiveness": urgency_score,
            "evidence": [
                "Deadline pressure caused compliance" if urgency_score > 0.5 else "Employee ignored deadline"
            ]
        }
        
        # ... other triggers
        
        return scores
    
    def _score_authority_trigger(self, campaign_data) -> float:
        """
        Authority effectiveness = (1 - resistance_when_authority_used) * (1 - time_to_question)
        """
        resistance_at_authority = campaign_data.resistance_signals[authority_message_idx]
        time_to_question = campaign_data.time_to_first_skepticism
        
        score = (1 - resistance_at_authority) * (1 - (time_to_question / 600))  # 600s baseline
        return max(0, min(1, score))
```

---

## 4. Threat Pattern Mining (Across Multiple Campaigns)

### 4.1 Cross-Campaign Pattern Analysis

```python
class ThreatPatternMiner:
    """
    Identify patterns across completed campaigns
    """
    
    async def mine_patterns(self, completed_campaigns: List[Campaign]) -> ThreatIntelReport:
        """
        Extract valuable threat intelligence from campaign data
        """
        
        report = ThreatIntelReport()
        
        # Pattern 1: Which triggers work best by department?
        report.trigger_effectiveness_by_department = self._analyze_by_department(
            completed_campaigns,
            metric="trigger_effectiveness"
        )
        # Output: Finance dept responds 70% to Authority, 40% to Urgency
        
        # Pattern 2: Which platforms are most effective?
        report.platform_effectiveness = self._analyze_by_platform(completed_campaigns)
        # Output: Email 45% success, WhatsApp 60% success, LinkedIn 55% success
        
        # Pattern 3: Attack chain success rates
        report.attack_chain_patterns = self._analyze_attack_chains(completed_campaigns)
        # Output: Email → Voice Call chain 75% effective; Email alone 40% effective
        
        # Pattern 4: Time-to-compromise distribution
        report.time_to_compromise_distribution = self._analyze_timings(completed_campaigns)
        # Output: 50% of employees compromised within 5 minutes; 20% within 30 minutes
        
        # Pattern 5: Vulnerability by role
        report.vulnerability_by_role = self._analyze_by_role(completed_campaigns)
        # Output: Finance staff 60% vulnerability; IT staff 20% vulnerability
        
        # Pattern 6: Emerging attack vectors
        report.emerging_patterns = self._identify_emerging_patterns(completed_campaigns)
        # Output: "Multi-platform coordination is more effective than single-channel attacks"
        
        return report
```

### 4.2 Anonymous Threat Intelligence Export

```python
class AnonymousThreatIntelGenerator:
    """
    Generate shareable threat intelligence (anonymized)
    """
    
    async def generate_threat_report(self, organization_id: str) -> ThreatIntelDocument:
        """
        Create anonymized threat report suitable for sharing with security community
        """
        
        report = ThreatIntelDocument()
        
        # Remove all PII
        # - Don't mention organization name
        # - Don't mention employee names
        # - Don't mention specific dates
        # - Generalize to patterns
        
        report.summary = """
This report analyzes 50 adversarial social engineering simulations conducted 
in a mid-market financial services organization (anonymized).

Key findings:
- Multi-platform attacks (Email → Voice Call) show 75% success rate
- Single-platform attacks show 40% success rate
- Authority figures (CEO personas) are 1.8x more effective than peer personas
- Out-of-band verification reduces success rate to 15%
        """
        
        report.methodology = "Controlled security simulations using PhishYou platform"
        report.data_points = 50
        report.attack_vectors = ["email", "whatsapp", "voice", "linkedin"]
        report.trigger_effectiveness = {
            "authority": 0.72,
            "urgency": 0.55,
            "fear": 0.48,
            "social_proof": 0.41
        }
        
        return report
```

---

## 5. Machine Learning: Learning from Campaigns

### 5.1 Campaign Performance Prediction

```python
class CampaignLearningModule:
    """
    Learn from past campaigns to predict success of future campaigns
    """
    
    async def predict_campaign_success(self, new_campaign: Campaign) -> SuccessPrediction:
        """
        Based on historical data, predict likelihood this campaign will succeed
        """
        
        # Extract features
        features = {
            "target_role": new_campaign.target.role,
            "target_department": new_campaign.target.department,
            "attack_type": new_campaign.type,
            "primary_trigger": new_campaign.primary_trigger,
            "platforms": new_campaign.platforms,
            "duration_hours": new_campaign.duration_hours
        }
        
        # Look up historical success rates for similar campaigns
        similar_campaigns = await self._find_similar_campaigns(features)
        
        # Calculate predicted success rate
        predicted_success_rate = statistics.mean([
            c.campaign_result.success for c in similar_campaigns
        ])
        
        # Generate recommendation
        if predicted_success_rate > 0.7:
            recommendation = "HIGH_SUCCESS_LIKELY"
        elif predicted_success_rate > 0.4:
            recommendation = "MODERATE_SUCCESS_LIKELY"
        else:
            recommendation = "LOW_SUCCESS_LIKELY_CONSIDER_MODIFICATION"
        
        return SuccessPrediction(
            predicted_success_rate=predicted_success_rate,
            recommendation=recommendation,
            similar_campaigns_analyzed=len(similar_campaigns)
        )
```

### 5.2 Next Campaign Recommendations

```python
async def recommend_next_campaign(self, completed_campaign: Campaign) -> NextCampaignRecommendation:
    """
    Based on what we learned, what should the next campaign be?
    """
    
    recommendation = NextCampaignRecommendation()
    
    # If this campaign succeeded, what made it work?
    if completed_campaign.result == "SUCCESS":
        recommendation.tactics_that_worked = completed_campaign.analysis.effective_triggers
        recommendation.recommended_next_step = "DEPLOY_TO_SIMILAR_TARGETS"
        recommendation.recommendation_rationale = f"Authority trigger was {completed_campaign.trigger_effectiveness.authority}% effective. Recommend deploying similar attacks against other Finance staff."
    
    # If this campaign failed, what should change?
    elif completed_campaign.result == "DEFENDED":
        recommendation.tactics_that_failed = completed_campaign.analysis.ineffective_triggers
        recommendation.recommended_next_step = "TRY_DIFFERENT_ANGLE"
        recommendation.recommendation_rationale = f"Employee successfully resisted authority-based attacks. Recommend trying social-proof or fear-based angles instead."
    
    return recommendation
```

---

## 6. AAR Data Schema (PostgreSQL)

```sql
CREATE TABLE campaign_analytics (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    
    -- Behavioral metrics
    resistance_score_final FLOAT,
    time_to_first_skepticism_seconds INT,
    time_to_defense_seconds INT,
    total_exchanges INT,
    
    -- Trigger effectiveness
    primary_trigger_used VARCHAR(50),
    primary_trigger_effectiveness FLOAT,
    secondary_trigger_used VARCHAR(50),
    secondary_trigger_effectiveness FLOAT,
    
    -- Emoji analysis
    emoji_sentiment_shift FLOAT,
    emoji_frequency_shift INT,
    
    -- Timing analysis
    avg_response_latency_seconds FLOAT,
    latency_trend VARCHAR(20),  -- 'increasing', 'decreasing', 'stable'
    
    -- Defense mechanism
    defense_mechanism VARCHAR(100),
    defense_success BOOLEAN,
    
    -- Generated AAR
    aar_json JSONB,
    aar_generated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
