import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Bot, ChevronRight, Command, FileText, FolderPlus,
  Layers3, MessageSquareText, Plug, Plus, Radio, Search, Settings2,
  ShieldCheck, Sparkles, Wand2,
} from 'lucide-react';

type CampaignStatus = 'planning' | 'active' | 'review';
interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  updated: string;
  channels: string[];
  note: string;
}

const campaigns: Campaign[] = [
  { id: 'camp_finance_q3', name: 'Finance verification resilience', status: 'active', updated: '2m ago', channels: ['Email', 'WhatsApp'], note: 'Agent monitoring approved simulation branches' },
  { id: 'camp_onboarding', name: 'New-hire trust exercise', status: 'planning', updated: '18m ago', channels: ['Email'], note: 'Context indexed · plan interview in progress' },
  { id: 'camp_exec', name: 'Executive verification drill', status: 'review', updated: 'Yesterday', channels: ['Voice', 'SMS'], note: 'Awaiting operator review before activation' },
];

const statusTone: Record<CampaignStatus, string> = {
  active: 'border-[#ff4757]/30 bg-[#ff4757]/10 text-[#ff8994]',
  planning: 'border-[#f5b942]/30 bg-[#f5b942]/10 text-[#f5c969]',
  review: 'border-[#2fd9c7]/30 bg-[#2fd9c7]/10 text-[#68eadc]',
};

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link to={`/campaigns/${campaign.id}`} className="group relative block overflow-hidden border border-white/[.08] bg-[#0b0d12]/85 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#ff4757]/35 hover:bg-[#0e1017]">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#ff4757]/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#657080]"><Radio className="h-3 w-3" /> Campaign node</div><h3 className="truncate text-base font-bold text-[#f5f7fb]">{campaign.name}</h3></div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#68717d] transition group-hover:text-[#ff6a76]" />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#8893a3]">{campaign.note}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-3"><div className="flex flex-wrap gap-1.5">{campaign.channels.map(channel => <span key={channel} className="border border-white/[.08] bg-white/[.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[.14em] text-[#9da7b5]">{channel}</span>)}</div><span className={`border px-2 py-1 font-mono text-[8px] uppercase tracking-[.16em] ${statusTone[campaign.status]}`}>{campaign.status}</span></div>
      <div className="mt-2 font-mono text-[9px] text-[#596270]">UPDATED {campaign.updated.toUpperCase()}</div>
    </Link>
  );
}

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const submit = (event: FormEvent) => { event.preventDefault(); const query = prompt.trim(); if (!query) return; navigate(`/campaigns/new?prompt=${encodeURIComponent(query)}`); };

  return <main className="relative min-h-screen overflow-hidden bg-[#07090d] text-[#f5f7fb]">
    <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-45" />
    <div className="pointer-events-none absolute left-[20%] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#ff263d]/[.055] blur-[140px]" />
    <div className="pointer-events-none absolute bottom-[-20rem] right-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#2fd9c7]/[.025] blur-[140px]" />

    <div className="relative mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[260px_minmax(0,1fr)_280px]">
      <aside className="hidden border-r border-white/[.07] bg-[#090b10]/90 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link to="/dashboard" className="flex items-center gap-3 border-b border-white/[.07] pb-5"><span className="flex h-10 w-10 items-center justify-center border border-[#ff4757]/30 bg-[#ff4757]/10 text-[#ff6a76]"><Bot className="h-5 w-5" /></span><div><div className="font-mono text-sm font-black tracking-[.16em]">PHISHYOU</div><div className="font-mono text-[8px] uppercase tracking-[.22em] text-[#657080]">Agent workspace</div></div></Link>
        <nav className="mt-7 space-y-1.5">
          <Link to="/dashboard" className="flex items-center gap-3 border-l-2 border-[#ff4757] bg-[#ff4757]/[.07] px-3 py-3 text-sm font-semibold text-white"><Command className="h-4 w-4 text-[#ff6a76]" /> Agent home</Link>
          <Link to="/campaigns/new" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-sm text-[#9ba6b4] transition hover:bg-white/[.035] hover:text-white"><Plus className="h-4 w-4" /> New campaign</Link>
          <Link to="/settings/integrations" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-sm text-[#9ba6b4] transition hover:bg-white/[.035] hover:text-white"><Plug className="h-4 w-4" /> Channels & plugins</Link>
          <Link to="/agent-tools" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-sm text-[#9ba6b4] transition hover:bg-white/[.035] hover:text-white"><Wand2 className="h-4 w-4" /> Agent tools</Link>
        </nav>
        <div className="mt-auto border border-white/[.08] bg-white/[.02] p-4"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#68eadc]"><ShieldCheck className="h-3.5 w-3.5" /> Guardrails online</div><p className="mt-2 text-xs leading-5 text-[#7f8a98]">Authorized scope and simulation controls are applied at campaign level.</p></div>
      </aside>

      <section className="flex min-w-0 flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/[.07] pb-5 lg:hidden"><Link to="/dashboard" className="font-mono text-sm font-black tracking-[.16em]">PHISHYOU<span className="text-[#ff4757]">//</span></Link><Link to="/agent-tools" className="border border-white/[.1] p-2 text-[#9da7b5]"><Settings2 className="h-4 w-4" /></Link></header>
        <div className="mx-auto flex w-full max-w-[940px] flex-1 flex-col justify-center py-12">
          <div className="py-fade-up text-center"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-[#ff4757]/30 bg-[#ff4757]/10 text-[#ff6a76] shadow-[0_0_55px_rgba(255,71,87,.12)]"><Sparkles className="h-6 w-6" /></div><div className="font-mono text-[10px] uppercase tracking-[.28em] text-[#ff6a76]">Intelligence agent / ready</div><h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">What are we working on?</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#909baa]">Start a new authorized campaign, continue a previous one, or ask PhishYou to help structure the next resilience exercise.</p></div>

          <form onSubmit={submit} className="py-fade-up py-fade-up-delay-2 relative mt-9 border border-[#ff4757]/25 bg-[#090b10]/90 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-xl"><div className="absolute -left-px -top-px h-7 w-7 border-l border-t border-[#ff4757]" /><div className="absolute -bottom-px -right-px h-7 w-7 border-b border-r border-[#ff4757]" /><div className="flex items-center gap-3 px-3 py-3"><MessageSquareText className="h-5 w-5 shrink-0 text-[#68717d]" /><input value={prompt} onChange={event => setPrompt(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#68717d]" placeholder="Describe a campaign, ask a question, or tell the agent what you want to test…" /><button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ff4757] text-[#190609] transition hover:bg-[#ff6572]" aria-label="Send to PhishYou"><ArrowUpRight className="h-5 w-5" /></button></div><div className="flex flex-wrap gap-2 border-t border-white/[.06] px-3 py-2.5">{['Create a campaign', 'Plan an exercise', 'Review a campaign', 'What can you do?'].map(text => <button key={text} type="button" onClick={() => setPrompt(text)} className="border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-xs text-[#9ca6b4] transition hover:border-[#ff4757]/30 hover:text-white">{text}</button>)}</div></form>

          <div className="mt-8 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.2em] text-[#68717d]">Your campaigns</div><h2 className="mt-1 text-xl font-bold">Continue where you left off</h2></div><Link to="/campaigns/new" className="hidden items-center gap-2 border border-[#ff4757]/35 px-3 py-2 text-xs font-bold text-[#ff8994] transition hover:bg-[#ff4757]/10 sm:inline-flex"><FolderPlus className="h-4 w-4" /> New campaign</Link></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{campaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} />)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><Link to="/campaigns/new" className="group border border-dashed border-white/[.14] bg-white/[.015] p-4 transition hover:border-[#ff4757]/35"><Plus className="h-4 w-4 text-[#ff6a76]" /><div className="mt-3 text-sm font-semibold">Start from context</div><p className="mt-1 text-xs leading-5 text-[#768190]">Create a campaign and attach an approved context pack.</p></Link><Link to="/settings/integrations" className="group border border-dashed border-white/[.14] bg-white/[.015] p-4 transition hover:border-[#2fd9c7]/35"><Plug className="h-4 w-4 text-[#68eadc]" /><div className="mt-3 text-sm font-semibold">Configure channels</div><p className="mt-1 text-xs leading-5 text-[#768190]">Manage connected delivery and intelligence adapters.</p></Link><Link to="/agent-tools" className="group border border-dashed border-white/[.14] bg-white/[.015] p-4 transition hover:border-[#f5b942]/35"><Layers3 className="h-4 w-4 text-[#f5c969]" /><div className="mt-3 text-sm font-semibold">Configure tools</div><p className="mt-1 text-xs leading-5 text-[#768190]">Choose which approved capabilities the agent can use.</p></Link></div>
        </div>
      </section>

      <aside className="hidden border-l border-white/[.07] bg-[#090b10]/80 p-5 backdrop-blur-xl lg:block"><div className="flex items-center justify-between"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[#68717d]">Agent context</div><span className="h-2 w-2 rounded-full bg-[#2fd9c7] shadow-[0_0_14px_rgba(47,217,199,.8)]" /></div><div className="mt-5 space-y-3"><div className="border border-white/[.08] bg-white/[.02] p-4"><FileText className="h-4 w-4 text-[#68eadc]" /><div className="mt-3 text-sm font-semibold">Context-aware planning</div><p className="mt-1 text-xs leading-5 text-[#788391]">Campaign knowledge stays attached to the campaign instead of being scattered across the dashboard.</p></div><div className="border border-white/[.08] bg-white/[.02] p-4"><Plug className="h-4 w-4 text-[#ff8994]" /><div className="mt-3 flex items-center justify-between text-sm font-semibold"><span>Connected adapters</span><span className="font-mono text-xs text-[#68eadc]">04</span></div><div className="mt-3 space-y-2 text-xs text-[#7e8997]"><div className="flex justify-between"><span>Messaging</span><span>Ready</span></div><div className="flex justify-between"><span>Mail</span><span>Ready</span></div><div className="flex justify-between"><span>AI provider</span><span>Ready</span></div></div><Link to="/settings/integrations" className="mt-4 inline-flex items-center gap-1 text-xs text-[#ff8994]">Manage integrations <ChevronRight className="h-3.5 w-3.5" /></Link></div></div></aside>
    </div>
  </main>;
}
