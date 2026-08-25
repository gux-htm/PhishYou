# PhishYou: Feature Breakdown by Platform

---

## 1. Email Attack Vectors

### Email Spoofing
- **SPF/DKIM Spoofing:** Spoof sender identity using domain configuration vulnerabilities
- **Display Name Manipulation:** "CEO <attacker@domain.com>" to mimic authority
- **Link Preview Manipulation:** Generate fake preview text for malicious links
- **Attachment Spoofing:** Create legitimate-looking attachments (PDFs, Docs, Sheets)

### Email Content Tactics
- Urgent deadline language ("Complete by EOD")
- Authority markers ("IT Security Department", official letterhead)
- Credential request ("Please verify your account")
- Wire transfer requests ("Urgent payment needed")
- Password reset flow ("Click to reset password")

### Multi-Turn Email Campaign
- Initial hook (authority + urgency)
- Follow-up when no response (escalation)
- Response to employee questions (adaptive to resistance)
- Final escalation (CEO impersonation or regulatory threat)

---

## 2. WhatsApp Attack Vectors

### Number Spoofing
- **JazzCash/Easypaisa Spoofing:** Pakistani fintech platform numbers
- **Bank Number Spoofing:** National bank customer service numbers
- **Corporate Numbers:** Company internal numbers

### Media Capabilities
- Voice messages (AI-synthesized)
- Document images (fake receipts, transaction screenshots)
- Video messages (future: deepfake video)

### WhatsApp-Specific Tactics
- Exploits immediacy of messenger (people respond faster to WhatsApp)
- Leverages informal language (less formal = more trust)
- Urgent alerts ("Your account has been compromised")

---

## 3. Instagram Direct Message

### Attack Profile
- Recruiter impersonation (LinkedIn job offer)
- Influencer impersonation (sponsorship offer)
- Verification attempt ("Click link to verify your account")

### Advantages
- High success among younger demographic
- Video/image-native (easier to embed malicious content)
- Less monitoring than email

---

## 4. LinkedIn Attack Vectors

### Credential Harvest
- Job offer scam (fake HR)
- Connection request social engineering
- Recommendation swap ("I'll endorse you if you verify your password")

### Personal Information Harvesting
- OSINT gathering (collect employee contact info)
- Sales pitch pretexting
- Recruiter "interview" (extract technical details)

---

## 5. SMS Attack Vectors

### Short Message Tactics
- Concise urgency ("Click link - Acct compromised")
- Spoofed bank numbers
- OTP/verification requests
- Delivery notifications (parcel delivery scam)

---

## 6. Voice Call Attack Vectors

### AI Voice Synthesis
- CEO impersonation (urgent wire transfer)
- Bank representative (account verification)
- Government authority (tax audit)
- IT department (system compromise)

### Call Sophistication
- Emotional tone (urgency, concern, authority)
- Background noise (office environment)
- Realistic voice patterns (speech rate, inflection)

---

## 7. Multi-Channel Coordination

### Sequential Attacks
1. **Email Initiation:** Authority-based request
2. **WhatsApp Escalation:** Urgent follow-up with media
3. **Voice Call Finale:** Authority escalation (CEO/CISO)
4. **SMS Backup:** If other channels blocked

### Simultaneous Attacks
- Email + WhatsApp at same time (cognitive overload)
- Voice call + SMS (verification attempt through multiple channels)

---

## 8. Document Generation

### Fake Receipts
- Bank transaction receipts
- Payment confirmations
- Invoice scans

### Official-Looking Documents
- Compliance notices
- Legal documents
- Regulatory warnings

### Realism Features
- Correct formatting for target region (US, UK, Pakistan, etc.)
- Authentic logos and watermarks
- Real transaction amounts
- Current date/time

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
