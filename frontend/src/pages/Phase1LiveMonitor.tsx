import { useMemo } from 'react';
import { Activity, ArrowLeft, CheckCircle2, Eye, FileCheck, MousePointerClick, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLiveCampaign } from '../mocks/usePhase1Mocks';

const eventIcon = { delivered: Send, opened: Eye, clicked: MousePointerClick, submitted: FileCheck } as const;
const eventColor = { delivered: '#2FD9C7', opened: '#5B9EFF', clicked: '#A78BFA', submitted: '#06D369' } as const;

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

export default function Phase1LiveMonitor() {
  const { id = '' } = useParams();
  const { campaign } = useLiveCampaign(id, 3000);

  const summary = useMemo(() => {
    if (!campaign) return { delivered: 0, opened: 0, clicked: 0, submitted: 0 };
    return {
      delivered: campaign.interactions.filter((item) => item.deliveryStatus === 'Delivered').length,
      opened: campaign.interactions.filter((item) => item.opened).length,
      clicked: campaign.interactions.filter((item) => item.clicked).length,
      submitted: campaign.interactions.filter((item) => item.submitted).length,
    };
  }, [campaign]);

  if (!campaign) return <div className="p-8 text-sm text-[#A8B4C4]">Phase 1 mock campaign not found.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link to={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A8595] hover:text-[#2FD9C7]"><ArrowLeft className="h-4 w-4" />Campaign detail</Link><span className="inline-flex items-center gap-2 rounded-full bg-[#2FD9C7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2FD9C7]"><Activity className="h-3.5 w-3.5" />LIVE · polling every 3s</span></div>
      <header className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#2FD9C7]">Live Monitor</div><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#F5F7FB]">{campaign.name}</h1><p className="mt-2 text-sm text-[#A8B4C4]">Goal: {campaign.campaignGoal}</p></div><Link to="/analytics" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2 text-xs font-semibold text-[#F5F7FB]">Open analytics</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-4">{[['Delivered', summary.delivered, '#2FD9C7'], ['Opened', summary.opened, '#5B9EFF'], ['Clicked', summary.clicked, '#A78BFA'], ['Converted', summary.submitted, '#06D369']].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="text-xs text-[#7A8595]">{label}</div><div className="mt-2 text-3xl font-black" style={{ color: String(color) }}>{value}</div></div>)}</div></header>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Interaction feed</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Real-time target events</h2><div className="mt-5 space-y-3">{[...campaign.events].reverse().map((event) => { const Icon = eventIcon[event.stage]; return <div key={event.id} className="flex gap-3 rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${eventColor[event.stage]}18`, color: eventColor[event.stage] }}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div className="text-sm font-semibold text-[#F5F7FB]">{campaign.targets.find((target) => target.id === event.targetId)?.name ?? event.targetId} · {event.stage}</div><div className="text-[10px] text-[#7A8595]">{formatTime(event.timestamp)}</div></div><div className="mt-1 text-xs leading-5 text-[#A8B4C4]">{event.detail}</div></div></div>; })}</div></div>

        <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7A8595]">Target state</div><h2 className="mt-2 text-xl font-bold text-[#F5F7FB]">Engagement progress</h2><div className="mt-5 space-y-4">{campaign.targets.map((target) => { const item = campaign.interactions.find((interaction) => interaction.targetId === target.id); if (!item) return null; const stages = [item.deliveryStatus === 'Delivered', item.opened, item.clicked, item.submitted]; return <div key={target.id} className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#2FD9C7]/10 text-xs font-bold text-[#2FD9C7]">{target.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#F5F7FB]">{target.name}</div><div className="truncate text-xs text-[#7A8595]">{target.department} · {target.role}</div></div><CheckCircle2 className={`h-4 w-4 ${item.submitted ? 'text-[#06D369]' : 'text-[#3D4860]'}`} /></div><div className="mt-4 grid grid-cols-4 gap-2">{['Delivered', 'Opened', 'Clicked', 'Submitted'].map((stage, index) => <div key={stage} className="rounded-lg border p-2 text-center" style={{ borderColor: stages[index] ? `${eventColor[['delivered', 'opened', 'clicked', 'submitted'][index] as keyof typeof eventColor]}50` : '#2D3748', color: stages[index] ? '#F5F7FB' : '#5A6470' }}><div className="text-[9px] uppercase tracking-wider">{stage}</div></div>)}</div></div>; })}</div></div>
      </section>
    </div>
  );
}
