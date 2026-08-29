import { AICampaignStudio } from '../components/campaigns/AICampaignStudio';

/**
 * Campaign creation is intentionally AI-first.
 * The campaign context, planning conversation and guardrails begin here;
 * delivery remains subject to explicit authorization and review.
 */
export default function CreateCampaign() {
  return <AICampaignStudio />;
}
