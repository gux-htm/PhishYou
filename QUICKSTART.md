# Quick Start: AI-Driven Campaign Creation

## 🚀 Get Started in 5 Minutes

### Step 1: Configure AI Provider (2 minutes)

1. Go to **Settings** in the navigation
2. Find **AI Configuration** section
3. Choose your provider:
   - **Gemini (Recommended):** Get free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Qwen:** Get API key from Alibaba Cloud
4. Enter your API key
5. Click **Test Connection** to verify
6. Click **Save Configuration**

### Step 2: Configure Email Sending (2 minutes)

1. Still in **Settings**, find **SMTP Configuration**
2. Enter your email provider details:
   
   **For Gmail:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: your_email@gmail.com
   - Password: your_app_password (not regular password)
   - From Name: IT Security Team
   - From Email: your_email@gmail.com

3. Click **Test SMTP Connection**
4. Click **Save Configuration**

> **Note:** For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833)

### Step 3: Create Your First Campaign (1 minute)

**Option A: Use AI Campaign Studio** (Recommended)
1. Navigate to **Campaigns** → **AI Campaign Studio**
2. Enter campaign name: "Test Awareness Campaign"
3. Instructions: "Create a simple phishing test for my team"
4. Click **Open agent**
5. Tell the AI:
   ```
   Create a campaign to test 3 employees:
   - John Doe, john@example.com, Engineering, Developer
   - Jane Smith, jane@example.com, Sales, Manager
   - Bob Johnson, bob@example.com, Finance, Analyst
   
   Use a password reset scenario with medium urgency.
   ```
6. AI will create the campaign automatically
7. Click **View & Launch Campaign**

**Option B: Use Enhanced AI Chat**
1. Go to **Agent Tools** → **Enhanced AI Chat**
2. Type:
   ```
   Create a phishing awareness campaign for testing. 
   Target: Engineering team
   Scenario: Suspicious email with link
   Send to: test@example.com
   ```
3. Follow AI's guidance
4. Campaign will be created automatically

### Step 4: Preview & Launch

1. After campaign creation, you'll see the campaign details
2. Click **Preview Emails** to see AI-generated personalized messages
3. Review each email - you can edit subject/body if needed
4. Click **Send Test** to send to yourself first
5. When ready, click **Launch Campaign**
6. Monitor execution in real-time

## 💡 Pro Tips

### Make Better Campaigns
- **Be Specific:** "Test password security with finance team" is better than "test security"
- **Provide Context:** Tell the AI about your organization, industry, and typical threats
- **Upload Files:** Attach employee lists, policies, or scenario briefs for better personalization

### Email Personalization
- AI automatically personalizes based on:
  - Department (e.g., technical terms for IT, financial terms for finance)
  - Role (different approach for managers vs. staff)
  - Context you provide (company events, systems, processes)

### Test Before Launching
1. Always send test emails to yourself first
2. Check spam folder
3. Verify links work correctly
4. Ensure formatting looks good

## 📋 Example Conversations with AI

### Example 1: Simple Test
```
You: "Create a test campaign for 5 people in sales"

AI: "I'll help create that. Can you provide:
     1. Names and emails of the 5 targets
     2. What behavior you want to test
     3. Urgency level (low/medium/high)"

You: "Test if they click suspicious links. Medium urgency.
     - Alice (alice@company.com)
     - Bob (bob@company.com)  
     - Carol (carol@company.com)
     - Dave (dave@company.com)
     - Eve (eve@company.com)"

AI: "Perfect! I've created 'Sales Team Link Awareness Campaign' 
     with personalized emails for each target. Ready to launch?"
```

### Example 2: Sophisticated Campaign
```
You: "Create a CEO fraud campaign targeting finance department"

AI: "I'll create a sophisticated CEO fraud simulation. 
     Tell me about:
     - Your CEO's name
     - Common urgent requests in your finance dept
     - Number of targets and their roles"

You: "CEO is Sarah Johnson. Finance team often gets urgent 
     wire transfer requests. Target 8 people: 2 managers, 
     6 analysts"

AI: "Creating a Tier-A campaign with:
     - Personalized 'from CEO' emails
     - Urgent wire transfer scenario
     - Role-appropriate language
     - 8 unique variations
     
     Should I proceed?"
```

### Example 3: Training Series
```
You: "I need to run monthly training campaigns for Q1"

AI: "I can help plan a quarterly training series. For each month:
     - What topics do you want to cover?
     - Same target audience or different?
     - Increasing difficulty or varied scenarios?"

You: "Start easy, get harder. Same 50 people from HR and IT.
     Jan: Basic phishing
     Feb: Spear phishing  
     Mar: Advanced social engineering"

AI: "I'll create 3 campaigns with progressive difficulty:
     January: Basic link phishing (Tier C)
     February: Targeted spear phishing (Tier B)
     March: Advanced social engineering (Tier A)
     
     Each will build on previous lessons. Create all three?"
```

## 🎯 Common Use Cases

### 1. Department-Wide Awareness
"Test our engineering department (30 people) for phishing awareness"

### 2. Executive Training
"Create an executive-level business email compromise simulation for C-suite"

### 3. New Hire Training
"Onboarding security test for 10 new employees starting Monday"

### 4. Compliance Testing
"Quarterly required security awareness test for all 200 employees"

### 5. Incident Response
"After last week's real phishing attempt, test if employees learned"

## 🔧 Troubleshooting

### AI Not Responding
- Check AI configuration in Settings
- Verify API key is correct
- Try refreshing the page

### Emails Not Sending
- Verify SMTP settings
- Check if you're using app password (for Gmail)
- Test SMTP connection in Settings
- Check spam folder

### Campaign Creation Failed
- Ensure you provided all required information
- Try being more specific about targets
- Check browser console for errors

## 📚 Next Steps

Once comfortable with basics:
1. Read [AI_CAMPAIGN_GUIDE.md](./AI_CAMPAIGN_GUIDE.md) for advanced features
2. Explore campaign analytics and reporting
3. Set up automated scheduling
4. Integrate with your organization's systems
5. Create custom email templates

## 🎉 You're Ready!

You now know how to:
- ✅ Configure AI and email services
- ✅ Create campaigns through conversation
- ✅ Generate personalized emails
- ✅ Launch and monitor campaigns

Start with a small test campaign and scale up as you get comfortable!

---

**Need Help?** Check the full guide: [AI_CAMPAIGN_GUIDE.md](./AI_CAMPAIGN_GUIDE.md)
