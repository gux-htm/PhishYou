/**
 * PhishYou — Create Campaign (`/campaigns/new`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 3: Campaign List → Create wizard entry
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 3: Create Campaign wizard
 *
 * Thin page shell around the CampaignWizard component: page header with a
 * back link, the four-step wizard, and the ethical guardrail summary required
 * before any Tier selection (PHISHYOU_SPECS/08_ETHICAL_FRAMEWORKS/).
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, FileCheck2, ScrollText, ShieldAlert } from 'lucide-react';
import { CampaignWizard } from '../components/campaigns/CampaignWizard';

const GUARDRAILS = [
  {
    icon: FileCheck2,
    title: 'Consent is mandatory',
    text: 'Every target must have signed consent on file before they can be added to a campaign roster.',
  },
  {
    icon: ScrollText,
    title: 'Everything is audited',
    text: 'Launches, pauses, compromises and debriefs are written to the hash-chained, immutable audit log.',
  },
  {
    icon: ShieldAlert,
    title: 'Tier responsibility escalates',
    text: 'Tier A disables harm detection — the organization assumes oversight responsibility via CISO attestation.',
  },
];

export default function CreateCampaign() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="py-fade-up">
        <Link
          to="/campaigns"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#7A8595] transition-colors hover:text-[#2FD9C7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All campaigns
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Create campaign</h1>
        <p className="mt-1 text-sm text-[#7A8595]">
          Four steps — basics, targets &amp; consent, AI configuration, delivery. Each step validates before you can advance.
        </p>
      </header>

      <CampaignWizard />

      <section
        aria-label="Ethical guardrails"
        className="grid gap-4 py-fade-up py-fade-up-delay-2 sm:grid-cols-3"
      >
        {GUARDRAILS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#232D39] text-[#A8B4C4]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-sm font-bold text-[#F5F7FB]">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-[#7A8595]">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
