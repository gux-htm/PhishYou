import type { MockTarget } from './targets';

export interface EmailPreview {
  id: string;
  targetId: string;
  subject: string;
  body: string;
  personalizationSummary: string[];
  deliverabilityReasoning: string;
  version: number;
}

export interface SpoofingRecommendation {
  recommended: boolean;
  recommendation: string;
}

function targetFirstName(target: MockTarget): string {
  return target.name.split(' ')[0] ?? target.name;
}

export function recommendSpoofing(goal: string, organizationContext: string): SpoofingRecommendation {
  const source = `${goal} ${organizationContext}`.toLowerCase();
  const recommended = /(security|verification|payment|finance|account|policy|it\b|hr\b)/.test(source);

  return recommended
    ? {
        recommended: true,
        recommendation: 'The mock AI recommends a simulation-only sender identity because the scenario depends on a recognizable organizational workflow. It should use a controlled domain rather than impersonating a real third-party sender.',
      }
    : {
        recommended: false,
        recommendation: 'The mock AI does not recommend sender spoofing for this context. A clearly identified simulation sender is sufficient for the stated objective.',
      };
}

export function buildEmailPreview(
  target: MockTarget,
  goal: string,
  organizationContext: string,
  version = 1,
): EmailPreview {
  const firstName = targetFirstName(target);
  const action = goal.trim() || 'review the requested security update';

  return {
    id: `preview-${target.id}`,
    targetId: target.id,
    subject:
      version % 2 === 0
        ? `Action needed: ${action.charAt(0).toUpperCase()}${action.slice(1)}`
        : `Please review: ${action.charAt(0).toUpperCase()}${action.slice(1)}`,
    body: `Hi ${firstName},\n\nWe are running an authorized security-awareness exercise for ${organizationContext || 'your organization'}. Please ${action}.\n\nUse the simulated exercise link in this message and follow the normal verification process you would use for a real request. No live credentials or real transactions are required.\n\nThanks,\nSecurity Operations`,
    personalizationSummary: [
      `Uses ${target.role} context from ${target.department}.`,
      target.personalContext,
      `Targets the stated campaign goal: “${action}”.`,
    ],
    deliverabilityReasoning:
      'The mock AI reasons about this target’s role, department, personal context, subject framing, message length, sender context, and timing cues to optimize simulation deliverability and reduce the chance an authorized exercise is incorrectly filtered by spam defenses. It does not reuse a one-size-fits-all broadcast message.',
    version,
  };
}
