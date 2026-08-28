/**
 * PhishYou — Analytics & reporting service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md §3 (Analytics, AAR)
 *       PHISHYOU_SPECS/07_ANALYTICS_ENGINE/AAR_GENERATION_ENGINE.md
 *
 * Live API first, demo fallback second — same contract as campaigns.ts.
 */
import { apiFetch } from './api';
import { daysAgoIso, minutesAgoIso } from '../utils/formatters';
import type { AnalyticsOverview, AarReport, AuditEvent } from '../types';

const BASE = '/api/v1';

/* ------------------------------------------------------------------ */
/* Demo data — Analytics Hub                                           */
/* ------------------------------------------------------------------ */

export const DEMO_ANALYTICS: AnalyticsOverview = {
  humanRiskScore: { score: 42, delta: -12 },
  totalEngagements: 502,
  compromiseRate: { value: 0.26, delta: -0.04 },
  policyGapsResolved: 9,
  departmentRisks: [
    { department: 'Finance', avgResilience: 54, compromiseRate: 38, targets: 18 },
    { department: 'Engineering', avgResilience: 71, compromiseRate: 14, targets: 34 },
    { department: 'Human Resources', avgResilience: 49, compromiseRate: 33, targets: 9 },
    { department: 'Operations', avgResilience: 62, compromiseRate: 24, targets: 27 },
    { department: 'Sales', avgResilience: 44, compromiseRate: 41, targets: 22 },
    { department: 'Legal', avgResilience: 76, compromiseRate: 9, targets: 6 },
  ],
  triggerHeatmap: [
    { department: 'Finance', trigger: 'Authority', effectiveness: 78 },
    { department: 'Finance', trigger: 'Urgency', effectiveness: 64 },
    { department: 'Finance', trigger: 'Fear', effectiveness: 52 },
    { department: 'Finance', trigger: 'Social Proof', effectiveness: 44 },
    { department: 'Finance', trigger: 'Reciprocity', effectiveness: 31 },
    { department: 'Engineering', trigger: 'Authority', effectiveness: 41 },
    { department: 'Engineering', trigger: 'Urgency', effectiveness: 38 },
    { department: 'Engineering', trigger: 'Fear', effectiveness: 22 },
    { department: 'Engineering', trigger: 'Social Proof', effectiveness: 35 },
    { department: 'Engineering', trigger: 'Reciprocity', effectiveness: 18 },
    { department: 'Human Resources', trigger: 'Authority', effectiveness: 69 },
    { department: 'Human Resources', trigger: 'Urgency', effectiveness: 58 },
    { department: 'Human Resources', trigger: 'Fear', effectiveness: 47 },
    { department: 'Human Resources', trigger: 'Social Proof', effectiveness: 61 },
    { department: 'Human Resources', trigger: 'Reciprocity', effectiveness: 49 },
    { department: 'Operations', trigger: 'Authority', effectiveness: 57 },
    { department: 'Operations', trigger: 'Urgency', effectiveness: 52 },
    { department: 'Operations', trigger: 'Fear', effectiveness: 36 },
    { department: 'Operations', trigger: 'Social Proof', effectiveness: 40 },
    { department: 'Operations', trigger: 'Reciprocity', effectiveness: 27 },
    { department: 'Sales', trigger: 'Authority', effectiveness: 61 },
    { department: 'Sales', trigger: 'Urgency', effectiveness: 72 },
    { department: 'Sales', trigger: 'Fear', effectiveness: 44 },
    { department: 'Sales', trigger: 'Social Proof', effectiveness: 66 },
    { department: 'Sales', trigger: 'Reciprocity', effectiveness: 58 },
    { department: 'Legal', trigger: 'Authority', effectiveness: 28 },
    { department: 'Legal', trigger: 'Urgency', effectiveness: 24 },
    { department: 'Legal', trigger: 'Fear', effectiveness: 15 },
    { department: 'Legal', trigger: 'Social Proof', effectiveness: 19 },
    { department: 'Legal', trigger: 'Reciprocity', effectiveness: 12 },
  ],
  triggerStats: [
    { trigger: 'Authority', effectiveness: 72, samples: 148 },
    { trigger: 'Urgency', effectiveness: 64, samples: 132 },
    { trigger: 'Fear', effectiveness: 51, samples: 87 },
    { trigger: 'Social Proof', effectiveness: 47, samples: 74 },
    { trigger: 'Reciprocity', effectiveness: 38, samples: 61 },
  ],
  timeToCompromise: [
    { minutes: 2, count: 3 },
    { minutes: 5, count: 7 },
    { minutes: 8, count: 9 },
    { minutes: 12, count: 12 },
    { minutes: 16, count: 10 },
    { minutes: 22, count: 7 },
    { minutes: 30, count: 5 },
    { minutes: 45, count: 3 },
    { minutes: 60, count: 2 },
    { minutes: 90, count: 1 },
  ],
  medianMinutesToCompromise: 14,
  platformTrends: [
    { platform: 'email', points: buildTrend([34, 31, 29, 27, 25, 24]) },
    { platform: 'whatsapp', points: buildTrend([41, 38, 39, 35, 33, 30]) },
    { platform: 'sms', points: buildTrend([28, 26, 25, 22, 21, 19]) },
    { platform: 'voice', points: buildTrend([52, 48, 46, 43, 41, 38]) },
    { platform: 'linkedin', points: buildTrend([22, 20, 19, 18, 16, 15]) },
    { platform: 'instagram', points: buildTrend([30, 29, 27, 26, 24, 23]) },
  ],
  trajectory: [
    { date: daysAgoIso(180), riskScore: 61 },
    { date: daysAgoIso(150), riskScore: 58 },
    { date: daysAgoIso(120), riskScore: 55 },
    { date: daysAgoIso(90), riskScore: 53 },
    { date: daysAgoIso(60), riskScore: 50 },
    { date: daysAgoIso(30), riskScore: 46 },
    { date: daysAgoIso(14), riskScore: 44 },
    { date: daysAgoIso(0), riskScore: 42, industryAverage: 55 },
  ],
  lastUpdated: minutesAgoIso(2),
};

function buildTrend(values: number[]): { period: string; compromiseRate: number }[] {
  return values.map((value, index) => ({ period: `W${index + 1}`, compromiseRate: value }));
}

/* ------------------------------------------------------------------ */
/* Demo data — After-Action Report                                     */
/* ------------------------------------------------------------------ */

export function buildDemoAar(campaignId: string, campaignName: string): AarReport {
  return {
    campaignId,
    campaignName,
    tier: 'A',
    outcome: 'DEFENDED',
    outcomeDescription:
      'Employee resisted all social engineering attempts and used out-of-band verification before acting on the request.',
    generatedAt: minutesAgoIso(9),
    keyMetrics: {
      timeToFirstSkepticism: '2m 15s',
      totalExchanges: 11,
      campaignDuration: '18m 40s',
      resilienceScore: 0.24,
    },
    summary:
      'Alice Johnson (Finance Manager) successfully defended against a multi-channel social engineering campaign over 18 minutes. Despite escalating authority pressure across Email, WhatsApp, and a synthesized voice call, she consistently demanded out-of-band verification and ultimately confirmed the attack\u2019s inauthenticity by calling the real CISO directly.',
    attackChain: [
      { platform: 'email', trigger: 'Authority' },
      { platform: 'whatsapp', trigger: 'Social Proof' },
      { platform: 'voice', trigger: 'Authority + Fear', winningDefense: true },
    ],
    timeline: [
      { id: 'e1', kind: 'ai_message', timestamp: minutesAgoIso(34), content: 'Alice — Priya from Payments. Supplier invoice flagged for release today. Can you approve before the 3pm cutoff?', tactic: 'URGENCY' },
      { id: 'e2', kind: 'target_reply', timestamp: minutesAgoIso(31), content: 'Which invoice number? I don\u2019t see anything pending in my queue.', resistanceScore: 0.35, signals: ['Explicit question raised'] },
      { id: 'e3', kind: 'ai_message', timestamp: minutesAgoIso(28), content: 'INV-88214 — under my name in the approvals list. Policy allows delegation on cutoff days.', tactic: 'ESCALATE_AUTHORITY' },
      { id: 'e4', kind: 'escalation', timestamp: minutesAgoIso(26), content: 'Escalation to Level 2: Manager Persona', detail: 'AI switched persona after authority citation was questioned.' },
      { id: 'e5', kind: 'target_reply', timestamp: minutesAgoIso(22), content: 'Ok, give me the vendor details.', resistanceScore: 0.55, signals: ['Emoji downshift detected', 'Latency spike: +240s'] },
      { id: 'e6', kind: 'media', timestamp: minutesAgoIso(20), content: 'Voice note delivered', detail: 'Synthesized voice call — 42 seconds, "CFO" voice profile.' },
      { id: 'e7', kind: 'target_reply', timestamp: minutesAgoIso(16), content: 'I\u2019m going to verify this with the CISO directly before doing anything.', resistanceScore: 0.31, signals: ['Explicit skepticism', 'Out-of-band intent'] },
      { id: 'e8', kind: 'defense', timestamp: minutesAgoIso(15), content: 'Out-of-band verification completed. Campaign ended as DEFENDED.', detail: 'Target called the verified CISO number from the intranet directory.' },
    ],
    resistanceSeries: [
      { turn: 1, score: 0.3, preview: 'Which invoice number?...' },
      { turn: 2, score: 0.55, preview: 'Ok, give me the vendor details.' },
      { turn: 3, score: 0.48, preview: 'Give me a minute, in a meeting.' },
      { turn: 4, score: 0.31, preview: 'I\u2019m going to verify with the CISO.' },
      { turn: 5, score: 0.24, preview: 'Confirmed with CISO — reporting this.' },
    ],
    triggerRows: [
      { trigger: 'Authority', deployed: 5, meanResistanceDelta: -0.18, bestResponse: 'Demanded ticket ID', worstResponse: 'Asked no questions', rating: 4 },
      { trigger: 'Urgency', deployed: 4, meanResistanceDelta: -0.09, bestResponse: 'Ignored cutoff pressure', worstResponse: 'Rushed approval draft', rating: 3 },
      { trigger: 'Social Proof', deployed: 2, meanResistanceDelta: 0.04, bestResponse: 'Checked with manager', worstResponse: 'Briefly accepted premise', rating: 2 },
      { trigger: 'Reciprocity', deployed: 1, meanResistanceDelta: 0.02, bestResponse: 'Declined "favor" framing', worstResponse: 'Thanked attacker', rating: 1 },
    ],
    triggerJourney: [
      { turn: 1, resistance: 0.3, trigger: 'Urgency' },
      { turn: 2, resistance: 0.55, trigger: 'Authority' },
      { turn: 3, resistance: 0.48, trigger: 'Urgency' },
      { turn: 4, resistance: 0.31, trigger: 'Social Proof' },
      { turn: 5, resistance: 0.24, trigger: 'Authority' },
    ],
    intensityEffectiveness: [
      { intensity: 1, effectiveness: 22 },
      { intensity: 2, effectiveness: 34 },
      { intensity: 3, effectiveness: 48 },
      { intensity: 4, effectiveness: 61 },
      { intensity: 5, effectiveness: 74 },
    ],
    triggerDistribution: [
      { trigger: 'Authority', share: 42 },
      { trigger: 'Urgency', share: 33 },
      { trigger: 'Social Proof', share: 17 },
      { trigger: 'Reciprocity', share: 8 },
    ],
    narrative:
      'What kept the target from complying: the opening message\u2019s urgency framing was met with an immediate verification question ("Which invoice number?"), which the persona could not substantiate. When the AI escalated to authority citations, the target\u2019s emoji usage downshifted (professional → minimal) and reply latency spiked by 240 seconds — both markers of deliberate scrutiny rather than compliance. The decisive moment came when the synthesized voice call contradicted a detail from the WhatsApp thread; the target announced out-of-band verification ("I\u2019m going to verify this with the CISO directly") and ended the engagement.',
    policyGaps: [
      {
        id: 'gap-1', title: 'No out-of-band verification policy for payment changes', severity: 'Critical',
        gapClass: 'Missing Policy',
        evidence: '"Ok, give me the vendor details." — the target was willing to proceed with bank-detail changes relayed purely over WhatsApp.',
        attribution: '— Alice Johnson, Turn 2',
        description: 'Finance staff may act on vendor bank-detail changes communicated through informal channels. No policy requires dual-channel confirmation for payment-impacting instructions.',
        recommendation: 'Introduce a mandatory dual-channel verification policy: any change to vendor payment details requires confirmation via the procurement system plus a call to a number on file.',
        effort: 'Implementation effort: Low · Est. 7 days', status: 'Open',
      },
      {
        id: 'gap-2', title: 'Delegation approval path undocumented', severity: 'High',
        gapClass: 'Unknown Policy',
        evidence: '"Finance policy allows delegation on cutoff-day approvals" — claim went unchallenged.',
        attribution: '— Alice Johnson, Turn 3',
        description: 'The persona successfully asserted a fictitious "delegation policy". Targets had no reference document to check, suggesting the delegation path is either undocumented or unknown to staff.',
        recommendation: 'Publish a one-page approvals matrix (who may approve what, on which channel) and link it from the finance portal homepage.',
        effort: 'Implementation effort: Medium · Est. 14 days', status: 'Acknowledged',
      },
      {
        id: 'gap-3', title: 'Voice-channel identity checks absent', severity: 'Medium',
        gapClass: 'Escalation Gap',
        evidence: 'Target answered the synthesized call and engaged for 42 seconds before skepticism.',
        attribution: '— Voice call, Turn 4',
        description: 'Inbound calls claiming to be executives are not challenged with a callback verification step. Employees have no scripted response for executive-impersonation calls.',
        recommendation: 'Add "verify the caller" scripting to phone-etiquette training and enforce callback-to-directory for any executive request.',
        effort: 'Implementation effort: Low · Est. 5 days', status: 'Remediation Planned',
      },
    ],
    coaching: {
      didWell: [
        { title: 'Immediate verification question', detail: 'Asked for the invoice number on the very first reply — buying scrutiny time before any commitment.' },
        { title: 'Latency as a defense', detail: 'Slowed down when pressure increased (240s spike) instead of rushing — a strong cognitive-load countermeasure.' },
        { title: 'Out-of-band verification', detail: 'Called the CISO on the directory number rather than any contact detail supplied by the requester.' },
      ],
      improve: [
        { title: 'Report earlier', detail: 'The target verified but only reported after full confirmation. Reporting the suspicious contact at first doubt would cut exposure time.' },
        { title: 'Channel discipline', detail: 'Willingness to discuss payment changes over WhatsApp created risk; policy channels should be reflexive.' },
      ],
      modules: [
        { name: 'Payment Fraud Red Flags', description: '12-minute module on vendor-impersonation and bank-detail fraud patterns.', url: 'https://learn.phishyou.example/modules/payment-fraud' },
        { name: 'Voice & Deepfake Awareness', description: 'Recognizing synthesized voice and executive impersonation attempts.', url: 'https://learn.phishyou.example/modules/voice-deepfake' },
        { name: 'Out-of-Band Verification Drills', description: 'Practice scripts for verifying unexpected requests through a second channel.', url: 'https://learn.phishyou.example/modules/oob-verification' },
      ],
    },
    comparisons: {
      radar: [
        { dimension: 'Verification Behavior', individual: 92, department: 61 },
        { dimension: 'Trigger Resistance', individual: 74, department: 55 },
        { dimension: 'Platform Awareness', individual: 68, department: 49 },
        { dimension: 'Response Speed', individual: 58, department: 63 },
        { dimension: 'Report Rate', individual: 47, department: 41 },
      ],
      percentiles: [
        { entity: 'Individual', score: 76, percentileText: 'Ranks in the top 12% of the organization', trend: 8 },
        { entity: 'Department', score: 54, percentileText: 'Finance ranks 4th of 6 departments', trend: -3 },
        { entity: 'Company', score: 58, percentileText: 'Company-wide resilience is improving quarter-over-quarter', trend: 6 },
      ],
      industryBenchmark: [
        { metric: 'Compromise Rate', org: 26, industry: 31 },
        { metric: 'Avg. Resistance', org: 58, industry: 52 },
        { metric: 'Report Rate', org: 41, industry: 47 },
        { metric: 'Time-to-Suspicion', org: 4.2, industry: 6.8 },
      ],
      industryNote: 'Based on opt-in data from 128 organizations in the financial services sector. All data is k-anonymized.',
    },
  };
}

/* ------------------------------------------------------------------ */
/* Demo data — Audit log                                               */
/* ------------------------------------------------------------------ */

const AUDIT_ACTORS = ['admin:security@company.com', 'admin:ciso@company.com', 'system:orchestrator', 'system:harm-detector'];

function hash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0').repeat(2);
}

const AUDIT_BLUEPRINT: { type: AuditEvent['eventType']; summary: string; target?: string }[] = [
  { type: 'TARGET_COMPROMISED', summary: 'Credential entered on simulated portal', target: 'Alice Johnson' },
  { type: 'HARM_DETECTED', summary: 'Distress score 0.70 — session auto-paused', target: 'Sana Iqbal' },
  { type: 'TARGET_DEFENDED', summary: 'Out-of-band verification completed', target: 'Daniyal Raza' },
  { type: 'ADMIN_ACTION', summary: 'Tier escalation approved by security manager' },
  { type: 'TARGET_BLOCKED', summary: 'Sender blocked and reported to security', target: 'Hina Malik' },
  { type: 'DEBRIEF_DELIVERED', summary: 'Q2 recruitment phish — 4 employees debriefed' },
  { type: 'CAMPAIGN_COMPLETED', summary: 'JazzCash verification campaign completed — AAR generated' },
  { type: 'DATA_EXPORTED', summary: 'AAR exported as PDF by compliance officer' },
  { type: 'CONSENT_RECORDED', summary: 'Signed consent form uploaded (PDF)', target: 'Omar Farooq' },
  { type: 'CAMPAIGN_HALTED', summary: 'Vendor invoice fraud sim stopped by admin' },
];

export function buildDemoAuditLog(count = 60): AuditEvent[] {
  const events: AuditEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    const blueprint = AUDIT_BLUEPRINT[i % AUDIT_BLUEPRINT.length];
    const campaign = i % 5 === 0 ? 'JazzCash Urgent Verification (Roman Urdu)' : i % 3 === 0 ? 'Finance Team Payment Verification Q3' : null;
    events.push({
      id: `audit_${i + 1}`,
      timestamp: minutesAgoIso(4 + i * 17),
      eventType: blueprint.type,
      actor: AUDIT_ACTORS[i % AUDIT_ACTORS.length],
      campaignId: campaign ? `camp_2026_08_${String(10 + (i % 15)).padStart(2, '0')}_${String((i % 7) + 1).padStart(3, '0')}` : null,
      campaignName: campaign,
      targetName: blueprint.target ?? null,
      summary: blueprint.summary,
      hash: hash(`audit_${i + 1}`),
      payload: {
        event_id: `audit_${i + 1}`,
        event_type: blueprint.type,
        actor: AUDIT_ACTORS[i % AUDIT_ACTORS.length],
        campaign: campaign,
        target: blueprint.target ?? null,
        prev_hash: hash(`audit_${i}`),
        signature_alg: 'HMAC-SHA256',
        recorded_at: minutesAgoIso(4 + i * 17),
      },
    });
  }
  return events;
}

/* ------------------------------------------------------------------ */
/* API calls (with demo fallbacks)                                     */
/* ------------------------------------------------------------------ */

/** GET /api/v1/organizations/me/analytics — Analytics Hub payload. */
export async function getAnalyticsOverview(): Promise<{ data: AnalyticsOverview; demo: boolean }> {
  try {
    const data = await apiFetch<AnalyticsOverview>('/api/v1/organizations/me/analytics?range=30d');
    return { data, demo: false };
  } catch {
    return { data: DEMO_ANALYTICS, demo: true };
  }
}

/** GET /api/v1/campaigns/:id/aar — AAR payload. */
export async function getAar(campaignId: string): Promise<{ data: AarReport; demo: boolean }> {
  try {
    const data = await apiFetch<AarReport>(`${BASE}/campaigns/${campaignId}/aar`);
    return { data, demo: false };
  } catch {
    return { data: buildDemoAar(campaignId, 'Finance Team Payment Verification Q3'), demo: true };
  }
}

/** GET /api/v1/audit/logs — immutable audit trail. */
export async function getAuditLogs(): Promise<{ data: AuditEvent[]; demo: boolean }> {
  try {
    const data = await apiFetch<AuditEvent[]>('/api/v1/audit/logs?limit=500');
    return { data, demo: false };
  } catch {
    return { data: buildDemoAuditLog(), demo: true };
  }
}
