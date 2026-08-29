import { ArrowUpRight, FolderPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const campaigns = [
  { id: '1', name: 'Q3 Finance resilience', status: 'Planning', detail: 'Context pack indexed', targets: 12, tier: 'B' },
  { id: '2', name: 'Executive awareness exercise', status: 'Review', detail: 'Plan awaiting approval', targets: 4, tier: 'A' },
  { id: '3', name: 'New-hire readiness', status: 'Complete', detail: 'Report available', targets: 18, tier: 'C' },
  { id: '4', name: 'Vendor invoice fraud drill', status: 'Active', detail: 'Live — 3 channels engaged', targets: 8, tier: 'A' },
  { id: '5', name: 'IT helpdesk password reset', status: 'Active', detail: 'Voice + email in progress', targets: 15, tier: 'B' },
  { id: '6', name: 'LinkedIn recruiter outreach', status: 'Planning', detail: 'Persona library under review', targets: 6, tier: 'C' },
];

export default function CampaignList() {
  return (
    <div className="py-page py-dashboard">
      <section className="py-command-hero">
        <div className="py-command-copy">
          <p className="py-eyebrow">CAMPAIGNS</p>
          <h1 className="py-title">
            Your active <span>simulations.</span>
          </h1>
          <p className="py-lede">
            Plan, launch and observe authorized awareness exercises. Every campaign is
            consent-gated, scoped and auditable from start to debrief.
          </p>
        </div>
        <div className="py-command-meta">
          <span><Sparkles size={14} /> {campaigns.length} CAMPAIGNS</span>
          <span>{campaigns.filter(c => c.status === 'Active').length} ACTIVE</span>
        </div>
      </section>

      <section className="py-dashboard-section">
        <div className="py-section-heading">
          <div>
            <p className="py-eyebrow">ALL CAMPAIGNS</p>
            <h2>Browse and manage</h2>
          </div>
          <Link to="/campaigns/new" className="py-primary py-small">
            <FolderPlus size={16} /> New campaign
          </Link>
        </div>

        <div className="py-campaign-list">
          {campaigns.map((campaign, i) => (
            <Link to={`/campaigns/${campaign.id}`} className="py-campaign-row" key={campaign.name}>
              <span className="py-campaign-number">0{i + 1}</span>
              <div>
                <h3>{campaign.name}</h3>
                <p>{campaign.detail} · {campaign.targets} targets</p>
              </div>
              <span className={`py-state ${campaign.status.toLowerCase()}`} style={campaign.status === 'Planning' || campaign.status === 'Review' ? { color: campaign.status === 'Review' ? '#d7a84b' : 'var(--teal)' } : undefined}>
                {campaign.status}
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
