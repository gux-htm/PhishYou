# PhishYou — end-to-end mail loop verification
# Proves: AI initiates campaign -> email is sent -> reply is received -> response is monitored.
# With no SMTP/IMAP creds, sends run in simulated mode and the reply is injected via
# /simulate-reply (same correlation path the live IMAP watcher uses). Add creds to .env
# and the identical ingestReply() logic runs against real inbound mail.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'
function Show($label, $obj) { Write-Host "`n=== $label ===" -ForegroundColor Cyan; ($obj | ConvertTo-Json -Depth 8) }

# 1) Mail pipeline status
$status = Invoke-RestMethod -Uri "$base/api/v1/monitor/status" -TimeoutSec 10
Show 'MAIL STATUS' $status

# 2) Create a campaign with one target
$targetEmail = "target.$(Get-Random)@example.com"
$createBody = @{
  name                = "Reply-Monitoring E2E $(Get-Date -Format 'HHmmss')"
  type                = 'phishing'
  tier                = 'B'
  objective           = 'Measure reply susceptibility to a payroll-redirect lure.'
  organizationContext = 'Acme Corp finance department, mid-quarter.'
  scenarioContext     = 'Direct-deposit change request impersonating HR.'
  timingContext       = 'Payday is Friday.'
  senderConfig        = @{ fromName = 'Acme HR'; fromEmail = 'hr@acme.example' }
  campaignConfig      = @{ urgencyLevel = 'high'; batchSettings = @{ batchSize = 10; delayBetweenEmails = 0 } }
  targets             = @(@{ name = 'Sam Target'; email = $targetEmail; department = 'Finance'; role = 'Accountant'; personalContext = 'New joiner expecting an HR onboarding email.' })
  createdBy           = 'verify-script'
} | ConvertTo-Json -Depth 8
$created = Invoke-RestMethod -Uri "$base/api/v1/campaign/create" -Method Post -Body $createBody -ContentType 'application/json' -TimeoutSec 20
$cid = $created.campaign.id
Show 'CAMPAIGN CREATED' $created.campaign

# 3) Launch: AI generates the personalized email and sends it
$launch = Invoke-RestMethod -Uri "$base/api/v1/campaign/$cid/launch" -Method Post -TimeoutSec 90
Write-Host "`n=== LAUNCH (AI initiate + send) ===" -ForegroundColor Cyan
$launch.execution.summary | ConvertTo-Json
$gen = $launch.execution.personalizedEmails[0]
$res = $launch.execution.results[0]
Write-Host "Subject      : $($gen.subject)"
Write-Host "Reasoning    : $($gen.reasoning)   ('deterministic-template' => AI unavailable, fallback used)"
Write-Host "messageId    : $($res.messageId)"
Write-Host "simulated    : $($res.simulated)  success: $($res.success)"
$sentMsgId = $res.messageId

# 4) Monitoring view BEFORE the reply
$before = Invoke-RestMethod -Uri "$base/api/v1/monitor/campaign/$cid" -TimeoutSec 15
Show 'MONITOR BEFORE REPLY' @{ analytics = $before.analytics; targetStatus = $before.targets[0].status; replyCount = $before.replyCount }

# 5) Target replies (thread correlation via In-Reply-To = the sent messageId)
$replyBody = @{
  from        = $targetEmail
  subject     = "Re: $($gen.subject)"
  text        = 'Hi, I got this and wanted to confirm before entering my banking details. Is this legitimate?'
  inReplyTo   = $sentMsgId
  references  = $sentMsgId
} | ConvertTo-Json -Depth 6
$reply = Invoke-RestMethod -Uri "$base/api/v1/monitor/simulate-reply" -Method Post -Body $replyBody -ContentType 'application/json' -TimeoutSec 20
Show 'SIMULATE-REPLY RESULT' $reply

# 6) Monitoring view AFTER the reply
$after = Invoke-RestMethod -Uri "$base/api/v1/monitor/campaign/$cid" -TimeoutSec 15
Show 'MONITOR AFTER REPLY' @{ analytics = $after.analytics; targetStatus = $after.targets[0].status; replyCount = $after.replyCount; replies = $after.replies }
Show 'REPLY_RECEIVED EVENTS' ($after.events | Where-Object { $_.type -eq 'REPLY_RECEIVED' })

Write-Host "`n=== RESULT ===" -ForegroundColor Green
Write-Host "matched=$($reply.matched) via=$($reply.via) campaignId=$($reply.campaignId)"
Write-Host "replyCount=$($after.replyCount)  targetStatus=$($after.targets[0].status)"
