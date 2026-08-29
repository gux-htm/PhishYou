import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Bot, ChevronRight, CirclePlus, Command, FileText, FolderKanban,
  MessageSquareText, PlugZap, Search, Settings2, ShieldCheck, Sparkles, Wrench,
} from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  status: 'planning' | 'ready' | 'active' | 'completed';
  channels: string[];
  updated: string;
  summary: string;
};

const campaigns: Campaign[] = [
  { id: 'camp_2026_08_27_001', name: 'Finance verification resilience', status: 'active', channels: ['Email', 'WhatsApp'], updated: '3m ago', summary: 'Agent is monitoring approved simulation branches and safety conditions.' },
  { id: 'camp_2026_08_27_002', name: 'HR onboarding awareness', status: 'planning', channels: ['Email'], updated: '24m ago', summary: 'Context indexed. The agent is collecting the remaining planning constraints.' },
  { id: 'camp_2026_08_27_003', name: 'Executive resilience exercise', status: 'ready', channels: ['Voice', 'SMS'], updated: 'Yesterday', summary: 'Plan is prepared and waiting for authorized operator review.' },
];

const statusTone: Record<Campaign['status'], string> = {
  planning: 'text-[#f6bf5c] border-[#f59e0b]/30 bg-[#f59e0b]/[.08]',
  ready: 'text-[#8bbcff] border-[#5b9eff]/30 bg-[#5b9eff]/[.08]',
  active: 'text-[#ff8b95] border-[#ff4757]/30 bg-[#ff4757]/[.08]',
  completed: 'text-[#58e6a0] border-[#06d369]/30 bg-[#06d369]/[.08]',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [query, setQuery] = useState('');
  const greeting = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    setQuery(value);
    setPrompt('');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 py-4 text-[#f5f7fb] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-50" />
      <div className="pointer-events-none absolute left-[18%] top-[-16rem] h-[42rem] w-[42rem] rounded-full bg-[#ff4757]/[.06] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-20rem] right-[-12rem] h-[36rem] w-[36rem] rounded-full bg-[#2fd9c7]/[.035] blur-[140px]" />

      <div className="relative mx-auto grid max-w-[1540px] gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="py-command-card hidden min-h-[calc(100vh-2rem)] p-4 xl:flex xl:flex-col">
          <Link to="/dashboard" className="flex items-center gap-3 border-b border-white/[.07] px-2 pb-5">
            <span className="flex h-9 w-9 items-center justify-center border border-[#ff4757]/30 bg-[#ff4757]/10 text-[#ff6673]"><Command className="h-4 w-4" /></span>
            <span><span className="block text-sm font-black tracking-[-.04em]">PHISHYOU</span><span className="font-mono text-[8px] uppercase tracking-[.22em] text-[#68717d]">Agent console</span></span>
          </Link>

          <Link to="/campaigns/new" className="mt-5 flex items-center justify-center gap-2 border border-[#ff4757]/35 bg-[#ff4757] px-3 py-3 text-xs font-black uppercase tracking-[.14em] text-[#190608] transition hover:bg-[#ff6875]">
            <CirclePlus className="h-4 w-4" /> New campaign
          </Link>

          <div className="mt-7"><p className="px-2 font-mono text-[9px] uppercase tracking-[.22em] text-[#5f6875]">Campaigns</p>
            <div className="mt-3 space-y-1">
              {campaigns.map((campaign) => <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="group block border border-transparent px-3 py-3 transition hover:border-white/[.08] hover:bg-white/[.025]">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-[#dce2eb]">{campaign.name}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${campaign.status === 'active' ? 'bg-[#ff4757] shadow-[0_0_12px_#ff4757]' : campaign.status === 'ready' ? 'bg-[#5b9eff]' : 'bg-[#68717d]'}`} /></div>
                <span className="mt-1 block font-mono text-[8px] uppercase tracking-[.16em] text-[#68717d]">{campaign.status} · {campaign.updated}</span>
              </Link>)}
            </div>
            <Link to="/campaigns/new" className="mt-3 flex items-center gap-2 px-3 py-2 text-xs text-[#8d98a7] hover:text-white"><Search className="h-3.5 w-3.5" /> Browse all campaigns</Link>
          </div>

          <div className="mt-auto border-t border-white/[.07] pt-4 space-y-1">
            <Link to="/tools" className="flex items-center gap-3 px-3 py-2.5 text-xs text-[#a8b4c4] transition hover:bg-white/[.035] hover:text-white"><Wrench className="h-4 w-4 text-[#ff6673]" /> Agent tools</Link>
            <Link to="/settings/integrations" className="flex items-center gap-3 px-3 py-2.5 text-xs text-[#a8b4c4] transition hover:bg-white/[.035] hover:text-white"><PlugZap className="h-4 w-4 text-[#2fd9c7]" /> Connections</Link>
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 text-xs text-[#a8b4c4] transition hover:bg-white/[.035] hover:text-white"><Settings2 className="h-4 w-4" /> Console settings</Link>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-5 flex items-center justify-between border-b border-white/[.07] pb-4 xl:hidden"><Link to="/dashboard" className="font-black tracking-[-.04em]">PHISHYOU</Link><Link to="/campaigns/new" className="text-xs font-bold text-[#ff8b95]">+ New campaign</Link></header>

          <section className="py-command-hero relative overflow-hidden px-6 py-7 sm:px-9 sm:py-10">
            <div className="absolute right-5 top-4 font-mono text-[9px] uppercase tracking-[.2em] text-[#697381]">{greeting} · agent ready</div>
            <div className="max-w-3xl py-fade-up">
              <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#ff7782]"><span className="py-status-dot h-2 w-2 rounded-full bg-[#ff4757]" /> Intelligence workspace</div>
              <h1 className="text-4xl font-black leading-[.95] tracking-[-.065em] sm:text-6xl">What are we working on?</h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#9ca8b7]">Start a campaign, continue a previous investigation, or ask the agent to help you understand the context already inside an authorized workspace.</p>
            </div>

            <form onSubmit={submit} className="relative mt-8 border border-[#ff4757]/25 bg-[#07090d]/80 p-1 shadow-[0_30px_90px_rgba(0,0,0,.4)] backdrop-blur-xl">
              <div className="absolute -left-px -top-px h-7 w-7 border-l border-t border-[#ff4757]" /><div className="absolute -bottom-px -right-px h-7 w-7 border-b border-r border-[#ff4757]" />
              <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#ff4757]/25 bg-[#ff4757]/10 text-[#ff7180]"><Bot className="h-5 w-5" /></span><input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#66707d]" placeholder="Ask PhishYou anything, or describe the campaign you want to plan…" /></div>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#ff4757]/30 bg-[#ff4757] px-5 text-xs font-black uppercase tracking-[.13em] text-[#180508]"><Sparkles className="h-4 w-4" /> Ask agent</button>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/[.06] px-3 py-2.5"><Link to="/campaigns/new" className="rounded border border-white/[.08] px-2.5 py-1.5 text-[11px] text-[#aab4c1] hover:border-[#ff4757]/35 hover:text-white">Plan a new campaign</Link><Link to="/tools" className="rounded border border-white/[.08] px-2.5 py-1.5 text-[11px] text-[#aab4c1] hover:border-[#ff4757]/35 hover:text-white">Configure agent tools</Link><Link to="/settings/integrations" className="rounded border border-white/[.08] px-2.5 py-1.5 text-[11px] text-[#aab4c1] hover:border-[#ff4757]/35 hover:text-white">Check connections</Link></div>
            </form>
            {query && <div className="mt-3 flex items-center gap-2 text-xs text-[#7f8a98]"><Sparkles className="h-3.5 w-3.5 text-[#2fd9c7]" /> Agent context queued for: <span className="text-[#dbe2eb]">{query}</span></div>}
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="py-command-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-[#ff7180]" /><h2 className="text-sm font-black">Your campaigns</h2></div><p className="mt-1 text-xs text-[#707b89]">Each campaign keeps its own context, plan, agent trace and outcomes.</p></div><Link to="/campaigns/new" className="hidden text-xs font-semibold text-[#ff8b95] sm:block">New campaign →</Link></div>
              <div className="divide-y divide-white/[.06]">{campaigns.map((campaign) => <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="group flex items-center gap-4 px-5 py-5 transition hover:bg-white/[.025]"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/[.08] bg-white/[.025] text-[#aab4c1]"><MessageSquareText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold text-[#e9edf2]">{campaign.name}</h3><span className={`border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[.15em] ${statusTone[campaign.status]}`}>{campaign.status}</span></div><p className="mt-1 truncate text-xs text-[#7d8897]">{campaign.summary}</p><div className="mt-2 flex gap-2">{campaign.channels.map(channel => <span key={channel} className="font-mono text-[9px] uppercase tracking-[.14em] text-[#596472]">{channel}</span>)}</div></div><ChevronRight className="h-4 w-4 shrink-0 text-[#596472] transition group-hover:translate-x-1 group-hover:text-[#ff7180]" /></Link>)}</div>
              <Link to="/campaigns/new" className="flex items-center justify-center gap-2 border-t border-white/[.07] px-4 py-4 text-xs font-semibold text-[#9da8b7] hover:bg-white/[.025] hover:text-white"><CirclePlus className="h-4 w-4" /> Start another campaign</Link>
            </section>

            <aside className="space-y-5">
              <Link to="/tools" className="py-command-card group block p-5 transition hover:border-[#ff4757]/30"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center border border-[#ff4757]/25 bg-[#ff4757]/10 text-[#ff7180]"><Wrench className="h-4 w-4" /></span><ArrowUpRight className="h-4 w-4 text-[#64707f] group-hover:text-[#ff7180]" /></div><h2 className="mt-5 text-lg font-black tracking-[-.04em]">Agent tools</h2><p className="mt-2 text-xs leading-5 text-[#778392]">Configure the approved analysis, simulation and review capabilities the agent may use.</p><div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#2fd9c7]"><ShieldCheck className="h-3.5 w-3.5" /> Guardrailed capabilities</div></Link>
              <Link to="/settings/integrations" className="py-command-card group block p-5 transition hover:border-[#2fd9c7]/25"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center border border-[#2fd9c7]/20 bg-[#2fd9c7]/[.08] text-[#2fd9c7]"><PlugZap className="h-4 w-4" /></span><ArrowUpRight className="h-4 w-4 text-[#64707f] group-hover:text-[#2fd9c7]" /></div><h2 className="mt-5 text-lg font-black tracking-[-.04em]">Connections</h2><p className="mt-2 text-xs leading-5 text-[#778392]">Manage approved channel adapters, model access and organization infrastructure.</p><div className="mt-4 font-mono text-[9px] uppercase tracking-[.18em] text-[#8b96a4]">Delivery stays under operator controls</div></Link>
              <div className="border border-white/[.08] bg-[#0b0e14]/75 p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#c9d1db]"><FileText className="h-4 w-4 text-[#a78bfa]" /> Workspace principle</div><p className="mt-2 text-xs leading-5 text-[#687483]">Campaign outcomes belong to campaigns. The home screen is for choosing work—not compressing every program metric into a wall of statistics.</p></div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
