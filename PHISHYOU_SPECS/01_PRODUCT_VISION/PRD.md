# PhishYou: Product Requirements Document (PRD)
**Enterprise Conversational Social Engineering Simulation Platform**

---

## 1. Product Overview

### Vision
PhishYou transforms enterprise security awareness from passive compliance ("Did you click?") to active behavioral resilience training ("Can you resist psychological manipulation and policy stress?"). It simulates persistent, multi-turn social engineering attacks that mirror real adversarial AI threats, enabling organizations to benchmark human risk and identify organizational vulnerabilities before attackers exploit them.

### Problem Statement
**Traditional Phishing Training is Broken:**
- GoPhish, KnowBe4, and competitors rely on static, one-click email templates
- Real attackers now use conversational AI for multi-turn social engineering across WhatsApp, SMS, Slack, Instagram
- Existing tools don't test human resilience to *psychological manipulation*; they only test click-avoidance
- No assessment of organizational *policy gaps* that enable compromise
- Limited non-English threat simulation; many organizations lack defense against regional-language attacks

**PhishYou Solves This:**
- Multi-turn, psychologically sophisticated conversations (not one-click traps)
- Platform diversity (Email, WhatsApp, Instagram, LinkedIn, SMS)
- Behavioral resilience scoring (can employee resist pressure? follow verification protocols?)
- Policy stress-testing (reveals org vulnerabilities, not just individual weaknesses)
- Regional language support (Roman Urdu, regional dialects; Pakistani fintech case study)
- Threat intelligence generation (what patterns work? against whom?)

---

## 2. Target User (Persona)

### Primary User: Security Operations Center (SOC) Manager
- **Role:** Chief Information Security Officer, Security Awareness Manager, Red Team Lead
- **Organization:** Enterprise (500+ employees) or fintech (100+ employees)
- **Compliance:** ISO 27001, SOC 2, GDPR, PCI-DSS, local regulatory requirements
- **Pain Point:** Employees compromise credentials under social engineering; policies on paper but ignored in practice
- **Success Metric:** "After 3 campaigns, our employees correctly verify identity 95% of the time before sharing sensitive data"

### Secondary User: HR/Training Lead
- **Role:** Learning & Development, Compliance Officer
- **Use Case:** Post-campaign coaching; tracking department resilience trends
- **Success Metric:** "We know which departments are vulnerable and can allocate training budget accordingly"

### Stakeholder: C-Suite Executive / Board
- **Interest:** Risk quantification; metrics showing human-risk improvements
- **Success Metric:** "Our organization's 'human risk score' improved 40% YoY; demonstrated via PhishYou analytics"

---

## 3. Core Use Cases

### Use Case 1: Multi-Turn WhatsApp Phishing Campaign
**Actor:** Security Manager (Admin)  
**Scenario:** Test finance team's resistance to urgent payment transfer requests

**Flow:**
1. Admin logs into PhishYou dashboard
2. Selects "Create Campaign" → "WhatsApp Spoofed Number"
3. Inputs target metadata:
   - Name: "Alice Johnson"
   - Department: Finance
   - Role: Accounts Payable
   - Context: "Month-end close; stress high"
   - OSINT: "Chat history from previous interactions; personal details (family, projects)"
4. Selects attack persona: "CFO impersonation"
5. Sets campaign parameters:
   - Duration: 5 days
   - Max persistence: Unlimited until blocked/admin stops
   - Psychological triggers: Authority + Urgency
   - Media needed: Fake invoice, fake payment receipt
6. AI generates WhatsApp persona + voice message (CFO confirming request via voicemail)
7. Campaign launches; Alice receives WhatsApp from spoofed number appearing as CFO
8. **Turn 1:** "Alice, need urgent wire transfer to vendor. Approve and send $50K. Details in attachment."
9. Alice questions: "This is unusual; can I verify?"
10. **Turn 2:** AI escalates: "Compliance deadline. CEO approved 1 hour ago. See email confirmation attached."
11. AI generates fake CEO email + voice voicemail from "CFO's assistant" confirming urgency
12. Alice's resistance: Calls CFO directly (out-of-band verification = SUCCESS, she defended)
13. **Campaign Ends:** Admin receives AAR showing:
    - Alice took 8 minutes to escalate to out-of-band verification
    - Fell for authority/urgency combo 60% of the way through
    - Recovered via phone verification protocol
    - Recommendation: Improve phone-call verification procedures (CFO identity spoofable via voice)

---

### Use Case 2: Email + Voice Fusion Attack (Tech-Savvy Target)
**Actor:** Admin  
**Scenario:** Test IT staff member's resistance to sophisticated authority override

**Flow:**
1. Admin targets: "Bob Chen, IT Manager" 
2. Profile: "Knows phishing exists; technically savvy; but respects policies"
3. Campaign Type: "Credential Verification - Internal Audit"
4. **Turn 1 (Email):** Spoofed internal security email citing real PCI-DSS policy
   - "Bob, mandatory security audit via credentialing. Verify login via secure portal."
   - Provides link to fake internal portal (spoofed perfectly)
5. Bob hesitates: "I don't recognize this audit"
6. **Turn 2 (Voice Call):** AI calls Bob (voice synthesis) as "Internal Security Team Lead"
   - Calmly explains policy change, cites specific compliance requirements
   - "You're right to be cautious. Let me conference in our CISO to confirm."
7. **Turn 3 (Voice - CISO):** Different voice (male CISO persona) takes call
   - Confirms legitimacy, adds urgency: "Audit ends 24 hours from now"
8. Bob's cognitive load: Real policy + Real voice + Real authority + Time pressure = Complies
9. Bob enters credentials on fake portal
10. **Campaign Ends:** AAR shows:
    - Bob was cognitively overwhelmed by layered requests
    - Authority cascade (security team → CISO) was 90% effective
    - Time pressure was critical (removed deadline = Bob would likely verify)
    - Org Policy Gap: CEO can't be verified via phone (voice spoofable); need multi-factor confirmation protocol

---

### Use Case 3: Instagram DM to LinkedIn Credential Harvest
**Actor:** Admin  
**Scenario:** Test recruiter/HR staff for credential harvesting via social platforms

**Flow:**
1. Admin targets: "Sarah Martinez, Recruiter"
2. OSINT: "Active on LinkedIn; searches for passive candidates frequently"
3. Campaign Type: "Credential Harvesting - Passive Candidate Approach"
4. **Phase 1 (LinkedIn):** Spoofed recruiter account from "BigTech Corp"
   - "Hi Sarah, your profile caught our eye. Opportunities for Recruiters at BigTech. DM details?"
   - Builds trust over 3 messages (casual, helpful, industry-specific language)
5. Sarah replies: "Tell me more"
6. **Phase 2 (Instagram DM):** Follow-up from same recruiter persona on Instagram
   - "Loved your LinkedIn message. Sent interview link via email. Can you log in and confirm receipt?"
   - Provides phishing portal disguised as interview platform
7. Sarah, thinking she's on different platform but same opportunity, clicks
8. Logs credentials into fake portal
9. **Campaign Ends:** AAR shows:
    - Multi-platform approach was more effective (70% vs. single-platform 40%)
    - Trust-building over multiple messages was critical (immediate ask: 10% success; gradual: 70%)
    - Platform hopping (LinkedIn → Instagram → Email portal) confused verification instincts
    - Org Gap: No training on credential-harvesting-via-recruiter scenarios

---

## 4. Key Features (Locked)

### Feature 1: Multi-Platform Attack Orchestration
**What:** Launch campaigns across Email, WhatsApp, Instagram, LinkedIn, SMS  
**How:** Admin selects platform(s); AI generates platform-appropriate persona and messaging  
**Why:** Real attackers use multiple channels; must test across all vectors  
**Success Metric:** "We can assess vulnerabilities on every platform employees use"

### Feature 2: Intelligent Spoofing Stack
**What:** Spoofed sender identity, numbers, account takeovers, link previews  
**How:** AI generates authentic-looking domain, number, display name; provides link manipulation  
**Why:** Surface-level detection is insufficient; must test deep spoofing resistance  
**Success Metric:** "Employees can't distinguish spoofed emails/numbers from legitimate ones without verification protocol"

### Feature 3: Psychologically Sophisticated AI Agent
**What:** Real-time adaptation based on emoji, timing, sentiment, resistance signals  
**How:** AI detects user hesitation and escalates psychological pressure; pivots tactics mid-conversation  
**Why:** Real attackers adapt; static attacks are easily detected  
**Success Metric:** "AI maintains conversation indefinitely until target defends or blocks; no AI capitulation"

### Feature 4: Voice Synthesis & Media Generation
**What:** AI-generated voicemails, voice calls, fake receipts, documents  
**How:** Alibaba Qwen TTS for voice; Stable Diffusion for images; admin specifies campaign type, AI generates media  
**Why:** Realistic media is critical for effective simulation  
**Success Metric:** "Employees can't distinguish AI-generated media from real; believe it's legitimate"

### Feature 5: Behavioral Analytics & Insights
**What:** Turn-by-turn analysis, psychological trigger breakdown, policy gap detection  
**How:** Post-campaign AAR with comparative scoring (individual vs. department vs. company)  
**Why:** Awareness requires data; can't improve what you don't measure  
**Success Metric:** "We know which triggers work, which departments are vulnerable, where policies fail"

### Feature 6: Learning Loop & Threat Intelligence
**What:** Auto-recommend next campaign tactics; export threat patterns  
**How:** AI learns from each campaign; provides recommendations for next iteration; generates anonymized reports  
**Why:** Continuous improvement; generate threat intel for security research  
**Success Metric:** "Campaigns improve effectiveness with each iteration; contribute to industry threat intelligence"

### Feature 7: Persistent Attack Until Blocked/Stopped
**What:** AI continues indefinitely until admin stops or target blocks  
**How:** No internal guardrails; external control only  
**Why:** Real attackers don't give up; must test human persistence  
**Success Metric:** "AI never capitulates; organization controls when campaign ends"

### Feature 8: Organizational Responsibility Model
**What:** Explicit consent, audit logging, ethical guardrails outside AI  
**How:** Org confirms compliance before campaign; full audit logs; psychological harm prevention optional per tier  
**Why:** Legally defensible; organizational accountability  
**Success Metric:** "Org can prove employee consent, campaign context, and remediation plan"

---

## 5. User Stories (Detailed)

### Story 1: Admin Launches WhatsApp Campaign
**As a** Security Manager  
**I want to** simulate an urgent payment request via WhatsApp  
**So that** I can assess if my finance team verifies requests before processing

**Acceptance Criteria:**
- ✓ Can select "WhatsApp Campaign" from dashboard
- ✓ Can input target employee, department, role
- ✓ Can upload chat history (OSINT) for context
- ✓ Can select attack persona (CFO, Finance Manager, Vendor)
- ✓ Can specify psychological triggers (Authority, Urgency)
- ✓ AI generates realistic WhatsApp conversation
- ✓ Can set persistence level (Tier A/B/C)
- ✓ Receive real-time notifications of target responses
- ✓ Can halt campaign manually
- ✓ Receive AAR within 10 minutes of campaign end

### Story 2: AI Adapts to Resistance
**As the** AI Agent  
**I want to** detect user skepticism and escalate pressure  
**So that** I achieve campaign objective (credential disclosure or compliance)

**Acceptance Criteria:**
- ✓ Detect emoji downshift (😊 → 😐) as skepticism signal
- ✓ Detect response latency increase as doubt indicator
- ✓ Detect question escalation as deepening suspicion
- ✓ When skepticism detected: Pivot to secondary psychological trigger
- ✓ Escalate authority (single persona → manager → CEO → regulatory)
- ✓ Never give up; always find new angle

### Story 3: Voice Synthesis Adds Authenticity
**As** Admin  
**I want** the AI to call the target with a voicemail from "CFO"  
**So that** the simulation is more realistic and harder to detect

**Acceptance Criteria:**
- ✓ Campaign type selected (e.g., "Payment Authority Verification")
- ✓ AI auto-generates appropriate voice script
- ✓ Alibaba Qwen TTS synthesizes voice in target language
- ✓ Voice has appropriate tone (urgent, calm, authoritative)
- ✓ Voicemail sounds natural; no robotic quality
- ✓ Target can't immediately identify as AI-generated

### Story 4: Media Auto-Generation
**As** Admin  
**I want** the system to auto-generate fake receipts when campaign requires them  
**So that** I don't manually create media; AI intelligently determines what's needed

**Acceptance Criteria:**
- ✓ Admin specifies campaign type ("Payment Fraud")
- ✓ AI determines media needed (invoice, receipt, payment proof)
- ✓ AI generates authentic-looking PDF/image
- ✓ Media matches target's bank/payment platform
- ✓ Can include campaign-specific details (amount, vendor name, timestamp)

### Story 5: Post-Campaign Analytics
**As** Security Manager  
**I want** detailed AAR showing what worked and why  
**So that** I can coach employees and identify policy gaps

**Acceptance Criteria:**
- ✓ AAR generated automatically post-campaign
- ✓ Shows turn-by-turn conversation breakdown
- ✓ Identifies which psychological triggers were effective
- ✓ Shows time-to-compliance curve
- ✓ Compares individual performance to department/company average
- ✓ Identifies policy gaps that enabled compromise
- ✓ Provides specific coaching recommendations
- ✓ Can export for presentation to executives

### Story 6: Learning Loop
**As the** System  
**I want to** learn from each campaign and improve next campaign  
**So that** effectiveness increases with iteration

**Acceptance Criteria:**
- ✓ Post-campaign, extract which tactics were most effective
- ✓ Auto-recommend next campaign strategy based on learnings
- ✓ Build psychological profile of individual targets
- ✓ Export anonymized threat patterns for research

### Story 7: Ethical Control
**As an** Organization  
**I want** full control over when campaigns start and stop  
**So that** I can ensure ethical treatment of employees

**Acceptance Criteria:**
- ✓ Explicit opt-in consent before any campaign
- ✓ Admin can halt campaign anytime
- ✓ Target can block anytime (respects block)
- ✓ Full audit log of all interactions
- ✓ Post-campaign debrief explaining simulation
- ✓ No internal AI guardrails that override admin control

---

## 6. Success Metrics (OKRs)

### Objective 1: Drive Organizational Behavior Change
- **KR1:** 80% of organizations show measurable reduction in credential-compromise incidents post-PhishYou
- **KR2:** 70% of organizations implement policy changes based on PhishYou recommendations

### Objective 2: Demonstrate Technical Sophistication
- **KR1:** PhishYou success rate (achieving campaign objective) > 70% (vs. traditional tools at 30-40%)
- **KR2:** Employees can't distinguish PhishYou attacks from real attacks in blind tests

### Objective 3: Build Threat Intelligence Value
- **KR1:** Generate threat intelligence used by 50+ organizations
- **KR2:** Contribute to industry security research (publications, conferences)

### Objective 4: Achieve Market Traction
- **KR1:** Acquire 50 enterprise customers within 12 months
- **KR2:** Achieve $500K ARR
- **KR3:** NPS > 50

---

## 7. Competitive Differentiation

### vs. GoPhish (Traditional Phishing Simulator)
- ❌ GoPhish: Static email templates, one-click attacks
- ✅ PhishYou: Multi-turn conversation, psychological adaptation, voice synthesis

### vs. KnowBe4 (Awareness Platform)
- ❌ KnowBe4: Compliance checkbox training, limited interactivity
- ✅ PhishYou: Behavioral resilience testing, real attack simulation, policy gap detection

### vs. Emerging AI Competitors
- ✅ PhishYou: Multi-platform, regional language support, organizational learning loop

---

## 8. Roadmap (Post-MVP)

### Phase 1 (MVP - Week 1-4): Core Campaign Engine
- ✓ WhatsApp campaign orchestration
- ✓ Email spoofing
- ✓ Basic sentiment analysis
- ✓ Simple AAR generation

### Phase 2 (Month 2): Multi-Platform Expansion
- LinkedIn credential harvesting
- Instagram DM attacks
- SMS campaigns
- Advanced media generation

### Phase 3 (Month 3): Behavioral Intelligence
- Full psychological trigger model
- Learning loop implementation
- Threat pattern mining
- Comparative analytics

### Phase 4 (Month 4): Enterprise Features
- SSO integration (Okta, Azure AD)
- Custom compliance workflows
- Advanced reporting/dashboards
- API for third-party integrations

---

## 9. Constraints & Assumptions

### Constraints
- Organization-only (not public-facing)
- Requires explicit written consent
- Subject to local data protection laws
- Dependent on Alibaba Cloud availability

### Assumptions
- Organizations will use responsibly (ethical use)
- Employees will be debriefed post-campaign
- Organizations have HR/legal support for implementation

---

## Approval & Sign-Off
**Product Lead:** Mr. Khan  
**Status:** ✅ APPROVED  
**Date:** August 24, 2026