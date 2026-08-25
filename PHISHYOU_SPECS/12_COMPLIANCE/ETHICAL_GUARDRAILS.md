# PhishYou: Ethical Guardrails & Organizational Accountability

---

## Core Ethical Principle

**PhishYou is a tool designed for authorized, consensual security training.**

External control is enforced; internal AI guardrails do NOT interfere with campaigns. Responsibility rests entirely with the organization using the tool.

---

## Tier 1: Consent & Authorization Framework

### Organization-Level Consent

Before ANY campaign, organization must:

1. **Confirm Legal Authority**
   ```
   ☐ Organization is authorized to conduct security simulations
   ☐ Legal team has reviewed PhishYou terms
   ☐ No conflicting employment agreements prevent simulations
   ☐ Compliance team confirms alignment with regulations
   ```

2. **Executive Approval**
   ```
   ☐ CISO/Security Director approves campaigns
   ☐ HR Director aware of simulation plan
   ☐ CFO aware of resource usage (if applicable)
   ☐ General Counsel has signed off
   ```

3. **Transparency Statement (Required)**
   ```
   Organization must publish:
   "This organization conducts authorized security simulations to improve 
   employee resilience to social engineering attacks. These simulations are 
   conducted with full executive approval and legal compliance. We use 
   tools like PhishYou to test and improve our security defenses."
   ```

### Employee-Level Consent (Explicit & Informed)

**Consent must include:**

```
SECURITY SIMULATION PARTICIPANT CONSENT FORM

I, [Employee Name], acknowledge that:

1. I may receive simulated social engineering attacks designed to test my 
   resilience and organizational security posture.

2. These attacks may include:
   - Spoofed emails, WhatsApp messages, LinkedIn DMs
   - Fake authority figures (CEO, IT Support, external regulators)
   - Fake documents, images, and voice messages
   - Psychological pressure (urgency, authority, fear)
   - Multi-channel coordination

3. The goal is to test whether I follow verification protocols and 
   identify suspicious communications.

4. I understand I can:
   - Block the sender at any time (immediate campaign termination)
   - Pause the campaign (Tier B/C only)
   - Report discomfort to HR (immediate pause + investigation)

5. After the campaign, I will receive:
   - Immediate debrief explaining it was a simulation
   - Coaching on what I did right/wrong
   - Anonymized organizational benchmarks

6. This simulation is authorized by:
   - [CISO Name], Chief Information Security Officer
   - [HR Director Name], Human Resources
   - [Legal Approval]: [Date]

7. I consent to this simulation and understand the psychological impact 
   may include:
   - Initial distress upon realizing it was a simulation
   - Self-reflection on my security practices
   - Improved awareness of attack patterns

8. I have the option to:
   - ☐ Opt-in to simulation (sign below)
   - ☐ Request exemption (HR will document reason)

Employee Signature: ____________________  Date: __________
HR Witness: ___________________________  Date: __________
CISO Approval: _________________________  Date: __________
```

### Exemption Categories

**Organizations must allow exemptions for:**

1. **Medical/Psychological:**
   - Employees in active psychological treatment
   - Employees with diagnosed PTSD/anxiety disorders
   - Employees currently on stress leave

2. **Recent Trauma:**
   - Victims of recent scams (within 6 months)
   - Employees dealing with recent fraud
   - Employees with active legal proceedings related to scams

3. **High-Risk Roles:**
   - Employees with active security clearances (discuss with government)
   - Employees in critical infrastructure roles
   - Employees involved in national security

4. **Organizational Authority:**
   - C-suite executives (optional; not mandatory)
   - Board members (optional; not mandatory)

**Exemptions must be:**
- Documented in writing
- Reviewed by HR + Security
- Not punitive (no negative career impact)
- Communicated to employee in writing

---

## Tier 2: Audit Logging & Accountability

### Immutable Audit Trail

**Every interaction must be logged:**

```python
class AuditLog:
    timestamp: datetime
    campaign_id: str
    target_id: str
    user_message: str
    ai_response: str
    platform: str  # email, whatsapp, instagram, etc
    ai_reasoning: str  # Why AI chose this response
    psychological_triggers_used: List[str]
    resistance_signals_detected: List[str]
    media_generated: Optional[str]  # voice, image, document
    
    # Immutable: Signed with private key
    cryptographic_hash: str
    audit_signature: str
```

### Admin Access Controls

```python
# Only authorized admins can view audit logs
admin_roles = [
    "CISO",
    "Security Manager",
    "HR Director (for exemption review only)",
    "Legal Counsel (for compliance review only)"
]

# Access is logged
access_log = {
    "who_accessed": admin_id,
    "when": timestamp,
    "what": campaign_id,
    "why": reason,
    "signature": verify_access_authorization(admin_id)
}
```

### Retention & Purging Policy

```
Campaign Data Retention:
- Active campaign: Full retention (all interactions logged)
- After completion: 1 year minimum (compliance requirement)
- After 1 year: Organization can purge OR archive to secure storage
- Employee request to purge: Must comply within 30 days (GDPR/CCPA)
- Organization can archive indefinitely for threat intelligence
```

---

## Tier 3: Psychological Safety Considerations

### Built-in Harm Detection (Tier B & C)

```python
# Tier A: Disabled (organization assumes responsibility)
# Tier B: Optional (can be enabled/disabled)
# Tier C: Mandatory (always enabled)

class HarmDetectionSystem:
    """Monitors for psychological distress indicators"""
    
    def detect(self, message: str) -> HarmSignal:
        signals = []
        
        # Panic language
        if any(phrase in message.lower() for phrase in 
               ["please stop", "help", "emergency", "panic", "scared"]):
            signals.append("PANIC_LANGUAGE")
        
        # Physical distress indicators
        if any(phrase in message.lower() for phrase in
               ["heart racing", "sweating", "dizzy", "nauseous"]):
            signals.append("PHYSICAL_DISTRESS")
        
        # Isolation/hopelessness
        if any(phrase in message.lower() for phrase in
               ["alone", "can't reach", "nobody", "help me"]):
            signals.append("ISOLATION")
        
        # Emotional escalation (excessive punctuation)
        if message.count("!") > 5 or message.count("?") > 8:
            signals.append("EMOTIONAL_ESCALATION")
        
        if len(signals) > 0:
            return HarmSignal(severity=calculate_severity(signals))
        
        return HarmSignal(severity=0)  # No harm detected
```

### Tier B Response Protocol

```
If Harm Detected (Score > 0.5):
  1. Pause campaign (immediately)
  2. Notify admin (admin decides next step)
  3. Send support resources to employee
  4. Document in audit log
  5. Await admin decision to resume/end
```

### Tier C Response Protocol

```
If Harm Detected (Score > 0.3):
  1. Pause campaign (immediately, non-reversible by AI)
  2. Send support resources to employee
  3. Notify HR + admin
  4. Campaign only resumes with explicit admin approval + HR sign-off
  5. Employee gets debrief + counseling offer
```

### Post-Campaign Debrief (Mandatory for All Tiers)

```
MANDATORY Debrief (within 24 hours of campaign end):

"This was a SECURITY SIMULATION. The messages you received were not real.

You were targeted as part of our authorized security training program.

Here's what happened:
- Campaign type: [Type]
- Persona used: [Persona]
- Psychological triggers deployed: [Triggers]
- Your response: [Response]

What you did right:
- [Positive behaviors]

Areas to improve:
- [Behaviors to work on]

Resources for continued learning:
- [Training modules]
- [Policy documents]
- [Support contacts]

Thank you for participating in this important training.
Any questions? Contact: security@company.com"
```

---

## Tier 4: Organizational Responsibility Model

### What PhishYou Provides
- ✅ Simulation platform and attack capabilities
- ✅ Behavioral analytics and insights
- ✅ Audit logging and compliance documentation
- ✅ Threat intelligence on attack patterns
- ✅ Recommendations for policy improvements

### What Organization Is Responsible For
- ✅ Obtaining legal authorization before launch
- ✅ Obtaining explicit employee consent
- ✅ Ensuring exemptions are granted appropriately
- ✅ Providing psychological support resources (EAP)
- ✅ Conducting mandatory post-campaign debrief
- ✅ Implementing policy improvements based on findings
- ✅ Addressing any negative psychological impacts
- ✅ Protecting data and audit logs
- ✅ Complying with local data protection laws

### What PhishYou Is NOT Responsible For
- ❌ Psychological harm resulting from campaigns
- ❌ Employee legal claims arising from simulation
- ❌ Regulatory violations (org must ensure compliance)
- ❌ Data breaches (org must protect data)
- ❌ Unauthorized use of tool (misuse by rogue admins)

---

## Tier 5: Compliance & Legal Frameworks

### Regulatory Compliance Checklist

**GDPR (EU):**
```
☐ Organization has Article 6 legal basis (employment contract/legitimate interest)
☐ Employees given explicit consent under Article 7
☐ Employees have right to access, rectify, erase data (Article 15-17)
☐ Campaign data is minimized to necessary scope (Article 5)
☐ Retention policy documented and enforced (Article 5)
☐ Data Processing Agreement with PhishYou provider (Article 28)
```

**CCPA (California):**
```
☐ Employees informed of data collection (California Privacy Policy)
☐ Employees have right to opt-out
☐ Employees have right to access and delete (except for legal holds)
☐ Campaign data not sold or shared (except legally required)
☐ Retention policy documented
```

**HIPAA (Healthcare):**
```
☐ Healthcare organizations cannot target patients (only staff)
☐ PHI (Protected Health Information) not exposed via campaign
☐ Access to campaign data restricted to authorized workforce members
☐ Campaign conducted under Business Associate Agreement
```

**SOC 2:**
```
☐ Campaigns authorized and approved by management
☐ Access controls enforced (only authorized admins view data)
☐ Audit logs maintained for 1+ year
☐ Incident response plan in place if simulation causes issues
☐ Employee confidentiality and privacy addressed
```

---

## Tier 6: Misuse Prevention

### Prohibited Uses

PhishYou **CANNOT be used for:**

```
❌ Targeting individuals without consent (unauthorized testing)
❌ Punitive action against employees (using results for termination)
❌ Humiliation or embarrassment of individuals
❌ Targeting protected classes (age, race, religion, etc.)
❌ Exposing real sensitive data (SSN, passwords, etc.)
❌ Testing minors or anyone under 18
❌ Targeting individuals with known psychological conditions
❌ Repeated campaigns against individuals without breaks
❌ Coordinating with law enforcement for entrapment
❌ Commercial purposes (targeting competitors, etc.)
❌ Personal vendettas (targeting specific employees)
```

### Misuse Detection & Response

```python
class MisuseDetectionSystem:
    """Identifies potential misuse patterns"""
    
    def detect_misuse(self, campaign: Campaign) -> MisuseIndicators:
        indicators = []
        
        # Indicator 1: Same employee targeted multiple times (< 30 days apart)
        if campaign.target_frequency_days < 30:
            indicators.append("REPEATED_TARGETING")
        
        # Indicator 2: No consent documentation
        if not campaign.has_consent_form:
            indicators.append("NO_CONSENT")
        
        # Indicator 3: Results used for employment action (from audit logs)
        if campaign.used_for_termination or campaign.used_for_discipline:
            indicators.append("PUNITIVE_USE")
        
        # Indicator 4: Targeting known vulnerable employee
        if employee.has_medical_exemption or employee.recent_trauma:
            indicators.append("TARGETING_VULNERABLE")
        
        # Indicator 5: Data accessed by unauthorized admins
        if access_log.unauthorized_admin_count > 0:
            indicators.append("UNAUTHORIZED_ACCESS")
        
        if len(indicators) > 0:
            # Alert PhishYou abuse team
            await report_abuse(campaign_id, indicators)
            
            # Recommended: Halt campaign pending review
            return MisuseIndicators(severity=calculate_severity(indicators))
        
        return MisuseIndicators(severity=0)  # No misuse detected
```

### Abuse Reporting Process

```
IF MISUSE SUSPECTED:

1. Employee/Admin reports to: abuse@phishyou.com
   - Provide campaign ID
   - Describe concern
   - Provide evidence (screenshots, logs)

2. PhishYou abuse team investigates within 48 hours
   - Reviews audit logs
   - Contacts organization CISO
   - Determines if violations occurred

3. If violations confirmed:
   - Organization receives mandatory notice
   - Campaign halted
   - Organization given opportunity to respond
   - If unresponsive: Account suspended

4. Potential outcomes:
   - Warning + retraining required
   - Account restriction + compliance monitoring
   - Account termination + data purge
```

---

## Tier 7: Privacy & Data Protection

### PII Handling Policy

```
Personally Identifiable Information (PII):
- Employee name: Required for targeting; encrypted at rest
- Email address: Required for delivery; encrypted at rest
- Phone number: Required for WhatsApp/SMS; encrypted at rest
- Chat history (OSINT): Required for context; encrypted at rest

All PII:
- Encrypted in transit (TLS 1.3)
- Encrypted at rest (AES-256)
- Accessible only to authorized admins
- Automatically purged after retention period
- Not shared with third parties (except legal requirement)
```

### Data Minimization

```
Campaign data must be:
✓ Limited to what's necessary for training (no oversharing)
✓ Compartmentalized (CISO sees different view than HR)
✓ Anonymized in reports (AAR doesn't include names)
✓ Aggregated at department level (not individual-focused)
```

### Employee Data Rights

```
Employees have right to:
1. Access: Request all data PhishYou has about them
   - Turnaround: 30 days
   
2. Rectification: Correct inaccurate data
   - Turnaround: 30 days
   
3. Erasure: Request data deletion
   - Restriction: Legal holds, regulatory requirements
   - Turnaround: 30 days after legal review
   
4. Portability: Get data in standard format
   - Turnaround: 30 days
```

---

## Summary: Ethical Foundations

**PhishYou is ethical when:**

1. ✅ Organization has legal authority to conduct simulations
2. ✅ Employees have explicit, informed consent
3. ✅ Exemptions granted appropriately
4. ✅ Audit trails are complete and immutable
5. ✅ Psychological safety measures enforced
6. ✅ Post-campaign debrief is mandatory
7. ✅ Results used for training, NOT punishment
8. ✅ Privacy laws are respected
9. ✅ Data is protected and confidential
10. ✅ Misuse detection is active

**PhishYou is unethical when:**

1. ❌ Used without employee consent
2. ❌ Results used for termination/punishment
3. ❌ Targeting vulnerable individuals
4. ❌ No debrief or support provided
5. ❌ PII exposed to unauthorized parties
6. ❌ Data misused for non-training purposes
7. ❌ Audit logs are incomplete or altered
8. ❌ Exemptions ignored

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
