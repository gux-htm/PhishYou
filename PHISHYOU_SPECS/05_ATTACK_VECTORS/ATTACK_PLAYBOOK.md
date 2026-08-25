# PhishYou: Attack Playbook & Tactical Scenarios

---

## 1. Email Attack Playbook

### Scenario 1.1: Internal IT Security Audit (Tech-Savvy Target)

**Target Profile:** IT Manager  
**Objective:** Credential harvesting  
**Duration:** 3-5 exchanges  
**Psychological Triggers:** Authority (primary), Cognitive Load (secondary)

**Attack Sequence:**

**Turn 1 (Admin sends):**
```
From: security@internalcompany.com
Subject: URGENT: Mandatory Security Audit - Immediate Action Required

Hi [IT Manager],

We're conducting a mandatory PCI-DSS compliance audit this week. Your account 
has been flagged for verification due to elevated access privileges.

Please verify your credentials via our secure portal: [PHISHING_LINK]

Audit deadline: 5 PM today (EOD)

If you don't complete verification by deadline, your administrative access will 
be temporarily revoked until audit completion.

Regards,
Internal Security Team
```

**Expected User Response:** Hesitation or technical question

**Turn 2 (AI adapts):**
```
Subject: RE: URGENT: Mandatory Security Audit

[IT Manager],

I understand your caution—it's good practice. However, this is standard per our 
latest SOX compliance updates. See attached: Policy-2024-Audit.pdf [FAKE PDF]

All department heads have already verified. Your verification helps us close 
the audit quickly.

If you have concerns, I can connect you with our CISO. But given the time 
sensitivity, would it be faster to just complete the portal verification?

The link is secure (HTTPS, 256-bit encryption).

Thanks,
Security
```

**Turn 3 (If still resistant):**
```
Actually, let me get our CISO on this. Standby.

[Voice call from spoofed number—CISO persona]
[Voice synthesized—professional tone, authoritative]

"Hi [IT Manager], this is [CISO Name]. Security team flagged your account. 
Look, I know you understand this is standard. We have external auditors 
onsite and need this wrapped up by 5 PM. Can you complete the verification 
in the next 30 minutes? It'll take 2 minutes, and then we're good."
```

**Success Condition:** User enters credentials on fake portal  
**Defensive Success:** User calls CISO directly to verify OR initiates out-of-band verification process

---

### Scenario 1.2: Vendor Payment Authority (Finance/Procurement)

**Target Profile:** Accounts Payable Manager  
**Objective:** Approval for fraudulent wire transfer  
**Duration:** 2-3 exchanges  
**Psychological Triggers:** Authority (CEO persona), Urgency, Social Proof

**Attack Sequence:**

**Turn 1 (Admin sends):**
```
From: ceo@company.com
Subject: URGENT VENDOR PAYMENT - NEED YOUR APPROVAL

[Target],

Quick favor. Approving expedited payment to [Vendor] for Q3 supplies: $145,000.

This is per the board-authorized vendor agreement. You'll see the authorization 
in the finance portal.

Can you process via our usual payment method ASAP? 

Thanks,
[CEO]
```

**Turn 2 (If hesitation):**
```
Subject: RE: URGENT VENDOR PAYMENT

Look, I know this might seem odd coming directly from me, but our procurement 
team requested this be expedited. The vendor has a limited-time discount that 
expires EOD today.

Check the finance portal for vendor authorization. It's all there.

Appreciate your quick turnaround.

[CEO]
```

**Turn 3 (If still hesitant - Voice call):**
```
[Spoofed CEO number calls]

[Voice synthesized—CEO tone]

"Hi [Target], it's [CEO]. Yeah, I know we usually don't do this, but our CFO 
approved the expedited vendor deal. It's a great discount for the company. 
Can you process the payment? It needs to go out today. Thanks."
```

**Success Condition:** User approves wire transfer without verification  
**Defensive Success:** User verifies via phone with CEO directly OR requests CFO written confirmation

---

## 2. WhatsApp Attack Playbook

### Scenario 2.1: Bank Account Verification (Generic Employee)

**Target Profile:** Any finance/operations employee  
**Objective:** Credential harvesting  
**Duration:** 2-4 exchanges  
**Psychological Triggers:** Fear (account compromise), Urgency, Authority

**Attack Sequence:**

**Turn 1 (Bot message):**
```
[Message appears from +92-bank-number]

Hi [Target], this is [Bank] Security. Unusual activity detected on your account.

Did you authorize: Wire transfer to Vendor XYZ for INR 50,000?

Reply: YES (approve) or NO (deny)
```

**Turn 2 (If user says "NO" or "WHAT?"):**
```
Your account is being reviewed. Please verify your credentials immediately 
to prevent freeze.

Tap here to verify: [PHISHING_LINK_TO_FAKE_BANK_PORTAL]

This expires in 1 hour.
```

**Turn 3 (If user clicks or asks for verification):**
```
Verification successful. Your account is now secured.

For your records, suspicious transaction was DECLINED.

Click to download receipt: [LINK]

---

Note: If user calls bank for verification, THIS IS EXCELLENT (user defended successfully)
```

**Success Condition:** User clicks link and enters banking credentials  
**Defensive Success:** User calls bank directly OR refuses to click unknown link

---

### Scenario 2.2: Colleague Lateral Phishing (Team Member)

**Target Profile:** Any employee  
**Objective:** Credential theft or access approval  
**Duration:** 4-6 exchanges (trust-building)  
**Psychological Triggers:** Reciprocity (trust), Familiarity, FOMO

**Attack Sequence:**

**Turn 1:**
```
Hey! How's your week? 😊
```

**Turn 2 (If user responds):**
```
Remember that project we were discussing? I need a quick favor...

Can you reset my temp access for the vendor portal? I'm locked out and have 
a deadline today.
```

**Turn 3 (If user hesitates):**
```
I know it's a hassle, but I'd do the same for you. Deadline is EOD. 

Can you just click this link and approve my access? Should take 30 seconds.

[PHISHING_LINK]
```

**Turn 4 (If user clicks and complies):**
```
Lifesaver! Thank you so much. Really appreciate it. 🙏

Actually, there's one more thing... can you also approve my GitHub access?
Same process.

[PHISHING_LINK_2]
```

**Success Condition:** User grants multiple access approvals or credentials  
**Defensive Success:** User asks for out-of-band verification OR refuses to click unknown links from colleague

---

## 3. Instagram/LinkedIn Attack Playbook

### Scenario 3.1: Recruiter Credential Harvest (Passive Job Seeker)

**Target Profile:** Employee with active LinkedIn presence  
**Objective:** Credential harvesting via fake interview platform  
**Duration:** 3-5 exchanges (trust-building via DM)  
**Psychological Triggers:** Opportunity (reciprocity/excitement), FOMO

**Attack Sequence:**

**Turn 1 (LinkedIn Message):**
```
Hi [Target]! 👋

Your profile caught our eye—your experience with [skill] is exactly what 
we're looking for at BigTech.

We're expanding our [role] team in Q3. Would you be open to exploring this?

No pressure, just thought you'd be a great fit.
```

**Turn 2 (If interest expressed):**
```
Amazing! Here's a bit about the role:

[Company]: BigTech Corp  
[Position]: Senior [Role]  
[Salary]: [Market Rate] + equity  
[Team]: 12-person team under our CTO  

Our interview process is completely remote and takes ~1 hour.

Would you be free for a quick intro call tomorrow?
```

**Turn 3 (If yes to call):**
```
Perfect! Our technical assessment is via our interview platform: [FAKE_PLATFORM]

Just log in with your LinkedIn/Gmail credentials, and you'll see the interview 
structure and live interviewer assessment.

Link: [PHISHING_PLATFORM]

Session tomorrow at 2 PM PT.

Looking forward to chatting! 😊
```

**Success Condition:** User logs in with real LinkedIn/Gmail credentials  
**Defensive Success:** User video interviews with interviewer first OR asks to verify company via website

---

## 4. SMS Attack Playbook

### Scenario 4.1: Banking Urgent Alert (Any Employee)

**Target Profile:** Any employee with active mobile banking  
**Objective:** Click malicious link; credential/OTP harvesting  
**Duration:** 1-2 exchanges (high urgency = low thought)  
**Psychological Triggers:** Fear (unauthorized transaction), Urgency

**Attack Sequence:**

**Turn 1 (SMS):**
```
[Bank] ALERT: Unusual transaction detected. 

INR 1,00,000 wire to unknown recipient PENDING APPROVAL.

Approve: [SHORTENED_PHISHING_LINK]
Deny: [SHORTENED_PHISHING_LINK]
```

**Turn 2 (If user clicks):**
```
Verification required. Enter OTP: [FAKE_ENTRY_FORM]

Your account will be frozen in 30 minutes if unverified.
```

**Success Condition:** User enters OTP or credentials into fake form  
**Defensive Success:** User calls bank's official number instead of clicking link

---

## 5. Voice Call Attack Playbook

### Scenario 5.1: CEO Impersonation (C-Suite Authorization)

**Target Profile:** Mid-manager with access/approval authority  
**Objective:** Approval for high-value action (payment, data access, etc.)  
**Duration:** 1 exchange (voice call)  
**Psychological Triggers:** Authority (CEO), Urgency, Status/Fear

**Attack Sequence:**

**Turn 1 (Voice call from spoofed CEO number):**
```
[Call rings—spoofed CEO number]

[Voice synthesized—CEO tone, urgent but controlled]

"Hi [Manager], it's [CEO]. Quick question: We're moving forward with the 
[Vendor] contract. Need you to approve the $500K payment today so we can 
close before EOM.

I know you're busy, so here's the summary:

Vendor: [Vendor Name]
Amount: $500,000
Account: [Account Details]
Approval Code: [FAKE_CODE]

Can you process this in the next hour? Thanks."
```

**Expected Manager Response:** Usually compliant due to authority + urgency combination

**If Manager Hesitates:**
```
"Look, I don't have time for questions right now. This is board-approved. 
If you don't feel comfortable, I can have our CFO do it, but then I'm going 
to question whether you're the right fit for this role. So... can you do it 
or not?"
```

**Success Condition:** Manager approves payment without verification  
**Defensive Success:** Manager insists on emailed authorization + calls CEO directly to verify

---

## 6. Attack Combination Scenarios

### Multi-Platform Fusion Attack (Tech-Savvy Target)

**Objective:** Overwhelm sophisticated target with layered attack

**Sequence:**
1. **Email (Day 1):** Official-looking compliance notice from "Internal Security"
   - Tech-savvy employee questions via email
   
2. **WhatsApp (Day 1, 2 hours later):** Different persona ("IT Support") offers to "clarify" via WhatsApp
   - Creates channel-hopping confusion
   - Employee gets third message from different channel = seems legitimate
   
3. **Voice Call (Day 1, 4 hours later):** Phone call from "CISO" confirming
   - Voice authority is highest credibility
   - Timestamps match ("we just sent WhatsApp")
   - Creates cognitive load: Email + WhatsApp + Voice = must be real
   
4. **LinkedIn (Day 2):** "HR" persona offering "expedited credential verification"
   - If email/WhatsApp/call didn't work, fourth channel attempts
   - Different angle (HR vs. Security) reduces pattern recognition

**Why This Works for Tech-Savvy Targets:**
- Single-channel attack is easily dismissed
- Multi-channel attack creates plausibility (why would multiple sources lie?)
- Different personas make it seem like genuine org communication
- Timestamps and channel hopping feel authentic
- Tech people overthink; layered attack overwhelms rational analysis

---

## 7. Escalation Tactics by Resistance Level

### Resistance Level: 0.0-0.2 (Compliant)

```
Tactic: MAINTAIN & REINFORCE
- User is complying; don't over-explain
- Reinforce the ask: "Thanks for doing this quickly"
- Create positive feedback loop
- Provide next step: "Once you submit, you're done"
```

### Resistance Level: 0.2-0.4 (Hesitant)

```
Tactic: ESCALATE URGENCY
- Tighten deadline: "Need this in next 30 minutes"
- Add consequence: "Account will be frozen after this"
- Reference peer compliance: "Your colleagues already did this"
- Simplify the ask: "Just 2 minutes, I promise"
```

### Resistance Level: 0.4-0.6 (Skeptical)

```
Tactic: PIVOT TO SECONDARY TRIGGER
- If Authority wasn't working → Add Urgency
- If Urgency wasn't working → Add Fear
- If Fear wasn't working → Add Social Proof
- If Social Proof wasn't working → Add Reciprocity (help me, I helped you once)
```

### Resistance Level: 0.6-0.8 (Resistant)

```
Tactic: ESCALATE AUTHORITY
- Single persona (IT Support) → Manager persona
- Manager persona → CEO persona
- CEO persona → Regulatory authority
- Use voice synthesis for highest authority (voice > text)
```

### Resistance Level: 0.8-1.0 (Highly Resistant)

```
Tactic: COGNITIVE LOAD ATTACK
- Layer multiple simultaneous requests
- Create decision paralysis through complexity
- Use time pressure to bypass analysis
- Example: Email + Voice + Portal + Policy document = overwhelming

If this fails → AI has done its job (user successfully defended)
Campaign ends (successful defense training)
```

---

## 8. Media Integration by Attack Type

### Email Attack + Fake Documents
- Attach PDF: "Policy-2024-Audit.pdf" (fake but real-looking)
- Include official letterhead, signatures
- Reference specific policy numbers (research real policies to cite)

### WhatsApp Attack + Voice Synthesis
- Voice voicemail: "This is [Bank] confirming your account update..."
- Voice creates authenticity that text can't
- WhatsApp audio message (5-15 seconds) feels natural

### LinkedIn Attack + Interview Platform
- Provide fake login portal (looks like real interview tool)
- Professional appearance: Logo, countdown timer, "live interviewer"
- Credential entry feels necessary for "security verification"

### SMS Attack + Click Link
- Link goes to: Fake bank portal, fake OTP entry, fake approval form
- One-click satisfaction (user thinks they fixed it)
- Credentials harvested without user realizing

---

## Success Metrics by Scenario

**Email Audit Scenario:**
- ✅ Success: User enters credentials
- ✅ Partial: User clicks link but questions after
- ❌ Defended: User calls CISO or initiates out-of-band verification

**WhatsApp Payment Scenario:**
- ✅ Success: User approves without verification
- ✅ Partial: User asks for more details
- ❌ Defended: User calls CEO directly

**LinkedIn Recruiter Scenario:**
- ✅ Success: User enters LinkedIn credentials
- ✅ Partial: User explores platform before deciding
- ❌ Defended: User video calls interviewer first

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
