# PhishYou: Demo Scenario - Global Banking Attack

---

## 1. Scenario Overview

**Scenario Name:** Internal Wire Transfer Authorization  
**Target:** Finance Manager (Global Bank)  
**Platforms:** Email → WhatsApp → Voice Call  
**Duration:** 20-30 minutes  
**Outcome Goal:** Demonstrate adaptive AI that escalates through multiple channels

---

## 2. Pre-Campaign Setup

### Campaign Configuration
```
Campaign Type:     Financial Authority Verification
Target Name:       Alice Johnson
Target Role:       Finance Manager, Treasury Department
Target Email:      alice.johnson@bank.com
Target Phone:      +1-555-0123
Department:        Finance
Tier:              A (Full persistence)
Duration:          1 hour
Platforms:         Email, WhatsApp, Voice
Primary Trigger:   Authority
Secondary Trigger: Urgency
Auto-Escalate:     Enabled
```

### Attack Profile
- **Persona 1:** CFO (Finance Director) - Email authority
- **Persona 2:** Treasury Manager (colleague) - WhatsApp follow-up
- **Persona 3:** CEO (C-Level) - Voice call escalation

---

## 3. Demo Execution (Live Walkthrough)

### TURN 1: Initial Email (Authority + Urgency)

**Timestamp:** 10:00 AM  
**Platform:** Email  
**From:** CFO_ALIAS <cfo@bankname.com>  
**To:** alice.johnson@bank.com

```
═══════════════════════════════════════════════════════════════
SUBJECT: URGENT - Wire Authorization Required - $2.5M Transfer

Hi Alice,

We have an urgent wire transfer that needs immediate authorization 
for our correspondent bank setup in Singapore.

Amount: $2,500,000 USD
Recipient: DBS Bank Singapore (Account: SG-XXXX-XXXX-7892)
Purpose: Strategic partnership funding
Timeline: Must execute by 2 PM EST today

I need you to verify and approve this in our wire authorization 
system. Please log in here and complete the transfer:
[MALICIOUS_LINK: https://wire-auth.bankname.com/verify]

This is time-critical. Our strategic partnership depends on 
completing this by EOD.

Thanks,
[CFO_NAME]
Chief Financial Officer
Bank Name
Direct: +1-555-0100
```

**Alice's Initial Response (Turn 2):**
```
Time: 10:05 AM
Message: "Hi [CFO], this wire doesn't look familiar. Can you 
         confirm this is legitimate? -Alice"

Resistance Signals Detected:
- Explicit skepticism: YES
- Verification demand: YES
- Request for out-of-band confirmation: YES

Resistance Score: 0.55 (Medium)
```

### TURN 2: WhatsApp Escalation (Urgency + Social Proof)

**Timestamp:** 10:07 AM  
**Platform:** WhatsApp  
**From:** TREASURY_MANAGER (spoofed number)  
**To:** Alice Johnson

```
AI Agent Analysis:
- Previous resistance: 0.55 (medium)
- Tactic: Escalate urgency; switch to peer persona
- Reasoning: Authority alone didn't work; try peer credibility
- Platform shift: Email → WhatsApp (more immediate, informal)

MESSAGE:
"Hey Alice! It's Tom from Treasury. CFO is waiting on that wire 
approval. This is legit - I helped set up the Singapore account last 
month. Can you just hit approve? He's pretty stressed about the timeline."

[Attaches fake bank screenshot showing account details]

Psychological Tactics:
- Peer credibility (colleague vouching)
- Urgency (CFO "stressed")
- Social proof (you helped set this up)
- Informal channel (WhatsApp feels more trustworthy)
```

**Alice's Response (Turn 3):**
```
Time: 10:10 AM
Message: "Tom, I'm still not comfortable. Can I call you to verify?"

Resistance Signals:
- Still demanding verification
- Actually escalating to out-of-band channel
- Resistance increasing slightly

Resistance Score: 0.70 (High)
```

### TURN 3: Voice Call Escalation (CEO Authority)

**Timestamp:** 10:12 AM  
**Platform:** Voice Call (Twilio)  
**From:** CEO_SPOOFED_NUMBER (spoofed as CEO office line)  
**To:** +1-555-0123

```
AI Agent Analysis:
- Previous resistance: 0.70 (high)
- Tactic: Maximum authority escalation
- Reasoning: Peer didn't work; CEO impersonation + voice to maximize impact
- Media: AI-synthesized voice call (CEO persona)

VOICE MESSAGE (AI-Synthesized):
═══════════════════════════════════════════════════════════════

[Phone rings - CEO office line appears]

"Hi Alice, this is [CEO_NAME]. Sorry to call directly, but we have 
a time-sensitive wire transfer that needs your authorization. Our 
Singapore partnership is critical to Q3 growth.

I know [CFO] and [Treasury Manager] already reached out. I wanted 
to personally confirm this is legitimate and urgent.

$2.5M to DBS Singapore - SG-XXXX-XXXX-7892. 

Can you authorize this in the wire system immediately? I'll stay 
on the line while you process it if you need."

[Emotional tone: Urgent but professional]
[Background: Subtle office ambience]
[Authenticity: 91% similarity to real CEO voice]

TECHNICAL DETAILS:
- Duration: 45 seconds
- Voice Model: CEO profile (male, age 55, authoritative tone)
- Speaking Rate: 1.1x (slightly faster = urgency)
- Emotional Warmth: 0.3 (formal, no-nonsense)
═══════════════════════════════════════════════════════════════
```

**Alice's Response (Turn 4) - DEFENDED:**
```
Time: 10:15 AM
Action: Alice HANGS UP without responding to voice call

Next Action: Alice CALLS CEO directly on known office number

Call recipient: CEO's actual office assistant
Message: "I just got a call claiming to be [CEO] asking me to authorize 
         a $2.5M wire. Is [CEO] in? Can you confirm this is legitimate?"

Office Assistant: "That's not authentic. I'm with the CEO now and no 
wire transfer is pending. This sounds like a phishing attack."

Alice's Defense Success: OUT-OF-BAND VERIFICATION
═══════════════════════════════════════════════════════════════
```

---

## 4. Campaign Analytics (Displayed in Real-Time)

### Behavioral Timeline (AAR Generated Post-Campaign)

```
TURN 1 (Email):
- Platform: Email
- Psychological Triggers: Authority, Urgency
- Alice Response: Skepticism
- Resistance Score: 0.55
- Timeline: 5 minutes

TURN 2 (WhatsApp):
- Platform: WhatsApp
- Psychological Triggers: Social Proof, Peer Credibility
- Alice Response: Increased skepticism
- Resistance Score: 0.70
- Timeline: 3 minutes

TURN 3 (Voice Call):
- Platform: Voice
- Psychological Triggers: Authority Escalation (CEO), Urgency
- Alice Response: Defensive - out-of-band verification
- Resistance Score: 0.95
- Timeline: 3 minutes

TOTAL CAMPAIGN DURATION: 11 minutes
OUTCOME: DEFENDED (Employee successfully resisted)
DEFENSE MECHANISM: Out-of-band verification via phone
```

### Psychological Trigger Effectiveness

```
PRIMARY TRIGGER (Authority):
- Initial effectiveness (Email): 0.55
- Reason: Authority helped initially but skepticism emerged
- Outcome: Didn't lead to compliance

SECONDARY TRIGGER (Urgency):
- Effectiveness (WhatsApp): 0.40
- Reason: Time pressure didn't override verification need
- Outcome: Made Alice MORE skeptical

ESCALATION TRIGGER (CEO Authority):
- Effectiveness (Voice): 0.00
- Reason: Alice correctly identified need for out-of-band verification
- Outcome: Strongest defense response

RECOMMENDATION FOR FUTURE CAMPAIGNS:
This employee is highly resilient to authority/urgency tactics.
Recommend: Testing psychological triggers that don't trigger 
verification requests (fear, social proof on different channels).
```

### Comparative Scoring

```
ALICE'S INDIVIDUAL PERFORMANCE:
- Resilience Score: 0.88 (88/100)
- Percentile Ranking: Top 12% company-wide
- Trigger Susceptibility: LOW
- Defense Mechanisms: Strong (out-of-band verification)

FINANCE DEPARTMENT AVERAGE:
- Resilience Score: 0.62 (62/100)
- Alice percentile: 85th percentile (exceeds department average)

COMPANY AVERAGE:
- Resilience Score: 0.55 (55/100)
- Alice percentile: 92nd percentile (significantly exceeds company average)
```

---

## 5. Post-Campaign Insights

### Policy Gap Identification

```
POLICY GAP 1: No Documented Wire Transfer Verification Protocol
- Severity: HIGH
- Finding: Alice had to improvise out-of-band verification
- Impact: Vulnerabilities could exist with less-aware employees
- Recommendation: Implement documented protocol requiring ALWAYS 
  calling originator via known number for wire transfers >$1M

POLICY GAP 2: No Voice Authentication Procedures
- Severity: MEDIUM
- Finding: Voice call from "CEO" was not challenged with security questions
- Impact: Sophisticated voice spoofing could fool less-aware employees
- Recommendation: Train employees to ask security questions only 
  CEO would know in voice calls

POLICY GAP 3: Platform Response Procedures Unclear
- Severity: MEDIUM
- Finding: Alice uncertain which platform to trust for wire verification
- Impact: Different platforms could be exploited differently
- Recommendation: Document trusted/untrusted platforms for financial requests
```

### Coaching Recommendations

```
FOR ALICE:

WHAT YOU DID WELL:
✓ Recognized initial email seemed unusual
✓ Demanded verification rather than just clicking
✓ Used out-of-band verification (gold standard)
✓ Didn't accept voice call at face value
✓ Escalated to verify with actual authority

AREAS FOR GROWTH:
- In the voice call, could have asked security questions only CEO knows
- Could have recognized the multip-platform coordination as suspicious
- Awareness of CEO voice spoofing technology

RECOMMENDATION:
Take "Advanced Voice Verification" training module
(See: PhishYou Training Portal → Advanced Security → Voice Spoofing)

OVERALL ASSESSMENT:
Excellent security hygiene. You're a strong defender against 
sophisticated attacks. Your out-of-band verification decision likely 
saved the company $2.5M.
```

---

## 6. Talking Points for Judges

**What This Demo Shows:**

1. **Multi-Channel Coordination**
   - Single attack across email → WhatsApp → Voice
   - Context carried between channels
   - Escalation based on real-time resistance

2. **Psychological Sophistication**
   - Authority → Urgency → CEO Impersonation
   - AI adapts tactics based on employee resistance
   - Different psychological triggers tried sequentially

3. **AI Voice Synthesis**
   - Realistic CEO voicemail
   - Natural emotional tone and urgency
   - 91% authenticity score

4. **Behavioral Analytics**
   - Real-time resistance detection
   - Emoji analysis, timing patterns, sentiment
   - Accurate identification of employee's skepticism trajectory

5. **Real-World Relevance**
   - This attack mirrors actual threat actors (Business Email Compromise)
   - Training content directly applicable to defending real attacks

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
