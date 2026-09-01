import { useMemo } from 'react';
import { Activity, ArrowRight, CheckCircle2, Eye, FileCheck, MousePointerClick, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Phase1FunnelChart } from '../components/analytics/Phase1FunnelChart';
import { usePhase1Analytics, usePhase1Campaigns } from '../mocks/usePhase1Mocks';

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export default function Phase1Analytics() {
  const { campaigns } = usePhase1Campaigns();
  const activeId = campaigns.find((campaign) => campaign.status === 'ACTIVE')?.id ?? campaigns[0]?.id ?? '';
  const { campaign, funnel } = usePhase1Analytics(activeId);

  const stats = useMemo(() => {
    if (!campaign) return null;
    const delivered = campaign.interactions.filter((item) => item.deliveryStatus === 'Delivered').length;
    const opened = campaign.interactions.filter((item) => item.opened).length;
    const clicked = campaign.interactions.filter((item) => item.clicked).length;
    const submitted = campaign.interactions.filter((item) => item.submitted).length;
    return { delivered, opened, clicked, submitted, total: campaign.targets.length };
  }, [campaign]);

  if (!campaign || !stats) return <div className="p-8 text-sm text-[#A8B4C4]">No Phase 1 mock analytics are available.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2FD9C7]">Phase 1 analytics</div><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#F5F7FB]">Campaign conversion funnel</h1><p className="mt-2 text-sm text-[#7A8595]">Aggregate interaction analytics for {campaign.name}. Values update from the shared mock event stream.</p></div><Link to={`/campaigns/${campaign.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2 text-xs font-semibold text-[#F5F7FB]">Campaign detail <ArrowRight className="h-3.5 w-3.5" /></Link></header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Delivered', stats.delivered, stats.total, Send, '#2FD9C7'],
        ['Opened', stats.opened, stats.delivered, Eye, '#5B9EFF'],
        ['Clicked', stats.clicked, stats.opened, MousePointerClick, '#A78BFA'],
        ['Converted', stats.submitted, stats.clicked, FileCheck, '#06D369'],
      ].map(([label, value, base, Icon, color]) => <article key={String(label)} className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-[#7A8595]">{label}</div><Icon className="h-4 w-4" style={{ color: String(color) }} /></div><div className="mt-4 text-3xl font-black text-[#F5F7FB]">{value}</div><div className="mt-1 text-xs text-[#7A8595]">{percent(Number(value), Number(base))}% of prior stage</div></article>)}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="flex items-center gap-2 text-xs font-semibold text-[#2FD9C7]"><Activity className="h-4 w-4" /> Funnel</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Delivered → Opened → Clicked → Converted</h2><Phase1FunnelChart data={funnel} /></div>
        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Live summary</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Per-target interaction breakdown</h2><div className="mt-5 space-y-3">{campaign.targets.map((target) => { const interaction = campaign.interactions.find((item) => item.targetId === target.id); if (!interaction) return null; return <div key={target.id} className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#F5F7FB]">{target.name}</div><div className="truncate text-xs text-[#7A8595]">{target.department} · {target.role}</div></div><div className="flex gap-1">{[interaction.deliveryStatus === 'Delivered', interaction.opened, interaction.clicked, interaction.submitted].map((done, index) => <span key={index} className="h-2.5 w-2.5 rounded-full" style={{ background: done ? ['#2FD9C7', '#5B9EFF', '#A78BFA', '#06D369'][index] : '#3D4860' }} title={['Delivered', 'Opened', 'Clicked', 'Submitted'][index]} />)}</div></div></div>})}</div><div className="mt-5 flex items-center gap-2 text-xs text-[#A8B4C4]"><CheckCircle2 className="h-4 w-4 text-[#2FD9C7]" />Interaction telemetry is simulated locally and can be swapped for API events later.</div></div>
      </section>
    </div>
  );
}
