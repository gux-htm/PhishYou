import { useMemo } from 'react';
import { ArrowLeft, ExternalLink, Eye, FileCheck, MousePointerClick, Send, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Phase1FunnelChart } from '../components/analytics/Phase1FunnelChart';
import { usePhase1Analytics } from '../mocks/usePhase1Mocks';

const statusClass = {
  Delivered: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  Pending: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  Bounced: 'bg-[#FF4757]/10 text-[#FF4757]',
};

function stamp(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : '—';
}

export default function Phase1CampaignDetail() {
  const { id = '' } = useParams();
  const { campaign, funnel } = usePhase1Analytics(id);
  const totals = useMemo(() => campaign ? ({
    delivered: campaign.interactions.filter((item) => item.deliveryStatus === 'Delivered').length,
    opened: campaign.interactions.filter((item) => item.opened).length,
    clicked: campaign.interactions.filter((item) => item.clicked).length,
    submitted: campaign.interactions.filter((item) => item.submitted).length,
  }) : null, [campaign]);

  if (!campaign || !totals) {
    return <div className="p-8 text-sm text-[#A8B4C4]">Phase 1 mock campaign not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A8595] hover:text-[#2FD9C7]"><ArrowLeft className="h-4 w-4" />Campaigns</Link>
        <div className="flex gap-2"><Link to={`/campaigns/${campaign.id}/live`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2FD9C7] px-4 py-2 text-xs font-bold text-[#0F1219]">Live monitor <ExternalLink className="h-3.5 w-3.5" /></Link><Link to="/analytics" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2 text-xs font-semibold text-[#F5F7FB]">Analytics</Link></div>
      </div>

      <header className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2FD9C7]">Campaign detail</div><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#F5F7FB]">{campaign.name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#A8B4C4]">Goal: <span className="font-semibold text-[#F5F7FB]">{campaign.campaignGoal}</span></p></div><span className="rounded-full bg-[#2FD9C7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2FD9C7]">{campaign.status}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-4"><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><Send className="h-4 w-4 text-[#2FD9C7]" /><div className="mt-4 text-2xl font-black">{totals.delivered}</div><div className="mt-1 text-xs text-[#7A8595]">Delivered</div></div><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><Eye className="h-4 w-4 text-[#5B9EFF]" /><div className="mt-4 text-2xl font-black">{totals.opened}</div><div className="mt-1 text-xs text-[#7A8595]">Opened</div></div><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><MousePointerClick className="h-4 w-4 text-[#A78BFA]" /><div className="mt-4 text-2xl font-black">{totals.clicked}</div><div className="mt-1 text-xs text-[#7A8595]">Clicked</div></div><div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><FileCheck className="h-4 w-4 text-[#06D369]" /><div className="mt-4 text-2xl font-black">{totals.submitted}</div><div className="mt-1 text-xs text-[#7A8595]">Converted</div></div></div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Conversion funnel</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Delivery → Opened → Clicked → Converted</h2><Phase1FunnelChart data={funnel} /></div>
        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Campaign configuration</div><div className="mt-4 space-y-4 text-sm"><div><div className="text-xs text-[#7A8595]">Organization context</div><div className="mt-1 text-[#F5F7FB]">{campaign.organizationContext}</div></div><div><div className="text-xs text-[#7A8595]">Scenario</div><div className="mt-1 text-[#A8B4C4]">{campaign.scenarioContext}</div></div><div><div className="text-xs text-[#7A8595]">Timing</div><div className="mt-1 text-[#A8B4C4]">{campaign.timingContext || 'No additional timing context.'}</div></div><div className="rounded-xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/[.04] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#2FD9C7]"><ShieldCheck className="h-4 w-4" /> Spoofing strategy</div><p className="mt-2 text-xs leading-5 text-[#A8B4C4]">{campaign.spoofing.recommendation}</p><div className="mt-3 text-xs text-[#F5F7FB]">{campaign.spoofing.senderName} · {campaign.spoofing.senderEmail}</div></div></div></div>
      </section>

      <section className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Per-target analytics</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Real-time interaction status</h2></div><span className="text-xs text-[#7A8595]">Mock data updates every 4 seconds</span></div><div className="mt-5 overflow-x-auto"><table className="min-w-[860px] w-full text-left"><thead><tr className="border-b border-[#2D3748] text-[10px] uppercase tracking-[.14em] text-[#5A6470]"><th className="px-3 py-3">Target</th><th className="px-3 py-3">Delivery</th><th className="px-3 py-3">Opened</th><th className="px-3 py-3">Clicked</th><th className="px-3 py-3">Submitted</th><th className="px-3 py-3">Last signal</th></tr></thead><tbody>{campaign.targets.map((target) => { const interaction = campaign.interactions.find((item) => item.targetId === target.id); if (!interaction) return null; const last = [interaction.submittedAt, interaction.clickedAt, interaction.openedAt, interaction.deliveredAt].find(Boolean) ?? null; return <tr key={target.id} className="border-b border-[#2D3748]/70"><td className="px-3 py-4"><div className="font-semibold text-[#F5F7FB]">{target.name}</div><div className="mt-1 text-xs text-[#7A8595]">{target.department} · {target.role} · {target.email}</div></td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[interaction.deliveryStatus]}`}>{interaction.deliveryStatus}</span></td><td className="px-3 py-4 text-sm text-[#A8B4C4]">{interaction.opened ? `Opened · ${stamp(interaction.openedAt)}` : 'Not opened'}</td><td className="px-3 py-4 text-sm text-[#A8B4C4]">{interaction.clicked ? `Clicked · ${stamp(interaction.clickedAt)}` : 'Not clicked'}</td><td className="px-3 py-4 text-sm text-[#A8B4C4]">{interaction.submitted ? `Submitted · ${stamp(interaction.submittedAt)}` : 'Not submitted'}</td><td className="px-3 py-4 text-xs text-[#7A8595]">{stamp(last)}</td></tr>; })}</tbody></table></div></section>
    </div>
  );
}
