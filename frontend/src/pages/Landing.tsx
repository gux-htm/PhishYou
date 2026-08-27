import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, ChevronRight, Eye, Globe2, LockKeyhole, Play, Radar, ShieldCheck, Sparkles, Target, Users, Waves, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const capabilities = [
  { icon: Target, label: 'Adaptive simulations', text: 'Run authorized, multi-turn scenarios that adapt to real human behavior instead of testing a single click.' },
  { icon: BrainCircuit, label: 'Behavioral intelligence', text: 'Turn resistance, timing, sentiment, and verification behavior into signals your security team can act on.' },
  { icon: BarChart3, label: 'Actionable after-action reports', text: 'Connect campaign outcomes to policy gaps, coaching, and the next defensive move.' },
]

const channels = ['Email', 'WhatsApp', 'SMS', 'Voice', 'LinkedIn', 'Instagram']

function OrbitalExperience() {
  const [rotation, setRotation] = useState({ x: -7, y: 7 })
  const [activeChannel, setActiveChannel] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActiveChannel((current) => (current + 1) % channels.length), 1800)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[620px] [perspective:1200px]"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        setRotation({ x: -7 - y * 6, y: 7 + x * 10 })
      }}
      onMouseLeave={() => setRotation({ x: -7, y: 7 })}
    >
      <style>{`
        @keyframes pyOrbit { from { transform: rotateZ(0deg) rotateX(65deg); } to { transform: rotateZ(360deg) rotateX(65deg); } }
        @keyframes pyFloat { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-12px,0); } }
        @keyframes pyScan { 0% { transform: rotate(0deg); opacity: .1; } 35%,70% { opacity: .5; } 100% { transform: rotate(360deg); opacity: .1; } }
        .py-orbit { animation: pyOrbit 16s linear infinite; }
        .py-orbit-slow { animation: pyOrbit 25s linear infinite reverse; }
        .py-float-card { animation: pyFloat 5.5s ease-in-out infinite; }
        .py-scan { animation: pyScan 7s linear infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { .py-orbit,.py-orbit-slow,.py-float-card,.py-scan { animation: none !important; } }
      `}</style>
      <div className="absolute inset-[5%] rounded-full bg-[radial-gradient(circle,rgba(47,217,199,0.15),transparent_58%)] blur-3xl" />
      <div className="absolute inset-[8%] rounded-full border border-[#2FD9C7]/10 [transform:rotateX(67deg)]" />
      <div className="py-orbit absolute inset-[13%] rounded-full border border-[#2FD9C7]/25 [transform-style:preserve-3d]" />
      <div className="py-orbit-slow absolute inset-[24%] rounded-full border border-[#5B9EFF]/20 [transform-style:preserve-3d]" />
      <div className="absolute inset-[17%] rounded-full border border-white/[0.05] [transform:rotateY(68deg)]" />
      <div className="py-scan absolute inset-[14%] rounded-full bg-[conic-gradient(from_90deg,transparent_0deg,rgba(47,217,199,.28)_35deg,transparent_80deg)] blur-md" />

      <div
        className="absolute inset-[17%] rounded-[2rem] border border-white/[0.1] bg-[#111720]/90 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.48)] backdrop-blur-xl transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A8595]">Adaptive threat surface</div>
            <div className="mt-1 text-sm font-bold">Finance resilience · Q3</div>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/10 text-[#2FD9C7]"><Radar className="h-4 w-4" /></span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[['248', 'Targets'], ['61', 'Engaged'], ['74', 'Resilience']].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="text-lg font-black tracking-tight">{value}</div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7A8595]">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#2FD9C7]/15 bg-[#2FD9C7]/[0.045] p-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#A8B4C4]">Channel signal</span>
            <span className="font-mono text-[#2FD9C7]">{channels[activeChannel]}</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {channels.map((channel, index) => <span key={channel} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${index === activeChannel ? 'bg-[#2FD9C7] shadow-[0_0_14px_rgba(47,217,199,.5)]' : 'bg-[#2D3748]'}`} />)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#A8B4C4]"><Sparkles className="h-3.5 w-3.5 text-[#06D369]" /> AI adapts to resistance in real time</div>
        </div>

        <div className="mt-4 space-y-2.5">
          {[['08:42', 'Email opened'], ['08:49', 'Link inspected'], ['08:53', 'Verified out-of-band']].map(([time, event], index) => (
            <div key={event} className="flex items-center gap-3 text-xs">
              <span className={`h-2 w-2 rounded-full ${index === 2 ? 'bg-[#06D369] shadow-[0_0_12px_rgba(6,211,105,.7)]' : 'bg-[#3D4860]'}`} />
              <span className="font-mono text-[#7A8595]">{time}</span>
              <span className="text-white/75">{event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="py-float-card absolute left-0 top-[18%] rounded-2xl border border-white/[0.08] bg-[#15191F]/85 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-[#5B9EFF]" /><span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Observe</span></div>
        <div className="mt-2 text-xs text-[#7A8595]">Behavior, not just clicks</div>
      </div>
      <div className="py-float-card absolute bottom-[16%] right-0 rounded-2xl border border-[#06D369]/15 bg-[#15191F]/85 p-3 shadow-2xl backdrop-blur-xl [animation-delay:-2.2s]">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#06D369]" /><span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Improve</span></div>
        <div className="mt-2 text-xs text-[#7A8595]">Close the learning loop</div>
      </div>
    </div>
  )
}

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden bg-[#0A0D13] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="py-grid-noise absolute inset-0 opacity-50" />
        <div className="absolute -left-40 top-[-10rem] h-[40rem] w-[40rem] rounded-full bg-[#2FD9C7]/10 blur-[140px]" />
        <div className="absolute right-[-14rem] top-[20%] h-[36rem] w-[36rem] rounded-full bg-[#5B9EFF]/[0.06] blur-[150px]" />
      </div>

      <header className="relative z-30 border-b border-white/[0.07] bg-[#0A0D13]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <button onClick={() => navigate('/')} className="group flex min-h-11 items-center gap-3 text-left" aria-label="PhishYou home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2FD9C7]/25 bg-[#2FD9C7]/10 text-[#2FD9C7] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_30px_rgba(47,217,199,.2)]"><ShieldCheck className="h-5 w-5" /></span>
            <span><span className="block text-sm font-extrabold tracking-[0.18em]">PHISHYOU</span><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">Human risk intelligence</span></span>
          </button>

          <nav className="hidden items-center gap-7 text-sm text-white/45 md:flex" aria-label="Primary navigation">
            <a href="#platform" className="hover:text-white">Platform</a><a href="#intelligence" className="hover:text-white">Intelligence</a><a href="#trust" className="hover:text-white">Trust</a>
          </nav>

          <div className="flex items-center gap-2"><button onClick={() => navigate('/login')} className="min-h-11 rounded-xl px-3 text-sm font-medium text-white/60 hover:bg-white/[0.04] hover:text-white">Sign in</button><button onClick={() => navigate('/login')} className="min-h-11 rounded-xl bg-[#2FD9C7] px-4 py-2 text-sm font-bold text-[#07110F] shadow-[0_12px_32px_rgba(47,217,199,.14)] hover:-translate-y-0.5 hover:bg-[#5BE7D8]">Request access</button></div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_.96fr] lg:gap-16">
            <div className="py-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.07] px-3.5 py-2 text-xs font-semibold text-[#8FEFE3]"><Sparkles className="h-3.5 w-3.5" /> Consent-first adversarial security training</div>
              <h1 className="mt-7 max-w-4xl text-[clamp(3.7rem,7.5vw,6.3rem)] font-black leading-[.91] tracking-[-.065em]">See the human side of <span className="bg-gradient-to-r from-[#2FD9C7] via-[#8FEFE3] to-[#5B9EFF] bg-clip-text text-transparent">cyber risk.</span></h1>
              <p className="mt-8 max-w-2xl text-base leading-8 text-[#A8B4C4] sm:text-lg">PhishYou orchestrates authorized, realistic social-engineering simulations and turns the way people respond under pressure into intelligence your security team can use.</p>
              <div className="mt-9 flex flex-wrap gap-3"><button onClick={() => navigate('/login')} className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2FD9C7] px-5 py-3.5 text-sm font-bold text-[#07110F] shadow-[0_14px_36px_rgba(47,217,199,.14)] hover:-translate-y-0.5 hover:bg-[#5BE7D8]">Enter the platform <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button><a href="#platform" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#3D4860] bg-white/[0.025] px-5 py-3.5 text-sm font-semibold text-[#F5F7FB] hover:border-[#2FD9C7]/45 hover:bg-[#2FD9C7]/[0.04]"><Play className="h-4 w-4 text-[#2FD9C7]" /> See how it works</a></div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#A8B4C4]">{['Authorized simulations', 'Multi-channel scenarios', 'Behavioral analytics'].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#06D369]" />{item}</div>)}</div>
            </div>
            <div className="py-fade-up py-fade-up-delay-2"><OrbitalExperience /></div>
          </div>
        </section>

        <section id="platform" className="border-y border-white/[0.06] bg-[#0F141C]/70">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2FD9C7]">One connected feedback loop</p><h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">Simulate. Understand. Strengthen.</h2><p className="mt-5 text-base leading-8 text-[#A8B4C4]">Move beyond checkbox awareness. Every campaign can connect realistic pressure, behavioral evidence, after-action insight, and targeted learning.</p></div><div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4 text-sm text-[#7A8595]"><span className="font-mono text-[#2FD9C7]">06</span> coordinated channels<br/><span className="font-mono text-[#06D369]">01</span> human-risk picture</div></div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">{capabilities.map(({ icon: Icon, label, text }, index) => <article key={label} className="py-sheen group rounded-2xl border border-white/[0.07] bg-[#121820]/85 p-7 transition duration-300 hover:-translate-y-1 hover:border-[#2FD9C7]/35 hover:shadow-[0_24px_60px_rgba(0,0,0,.28)]"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2FD9C7]/15 bg-[#2FD9C7]/[0.06] text-[#2FD9C7]"><Icon className="h-5 w-5" /></span><span className="font-mono text-xs text-white/20">0{index + 1}</span></div><h3 className="mt-8 text-xl font-bold">{label}</h3><p className="mt-3 text-sm leading-7 text-[#A8B4C4]">{text}</p><div className="mt-7 flex items-center gap-1.5 text-xs font-bold text-white/40 group-hover:text-[#2FD9C7]">Built into the loop <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div></article>)}</div>
          </div>
        </section>

        <section id="intelligence" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5B9EFF]">Behavioral intelligence</p><h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">The signal is in what happens after the message.</h2><p className="mt-6 text-base leading-8 text-[#A8B4C4]">PhishYou is designed to help authorized security teams understand verification habits, resistance patterns, timing, and policy friction—not simply count who clicked.</p><div className="mt-8 space-y-3">{[['Observe', 'Multi-turn interactions across approved channels'], ['Interpret', 'Behavioral patterns and organizational policy gaps'], ['Improve', 'Focused debriefs and next-campaign recommendations']].map(([title, text], index) => <div key={title} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#232D39] font-mono text-xs text-[#2FD9C7]">0{index + 1}</span><div><div className="text-sm font-bold">{title}</div><div className="mt-1 text-sm text-[#7A8595]">{text}</div></div></div>)}</div></div>
            <div className="relative rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-[#151C26] to-[#0D1118] p-6 shadow-[0_30px_90px_rgba(0,0,0,.35)] sm:p-8"><div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#5B9EFF]/10 blur-3xl" /><div className="relative flex items-center justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-[#7A8595]">Campaign intelligence</div><div className="mt-1 text-xl font-black">Pressure patterns</div></div><BrainCircuit className="h-6 w-6 text-[#A78BFA]" /></div><div className="relative mt-8 space-y-5">{[['Authority', 72, '#FF6B78'], ['Urgency', 64, '#F59E0B'], ['Verification', 84, '#06D369']].map(([label, value, color]) => <div key={label as string}><div className="mb-2 flex justify-between text-xs"><span className="text-[#A8B4C4]">{label}</span><span className="font-mono text-white/60">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#232D39]"><div className="h-full rounded-full" style={{ width: `${value}%`, background: color as string }} /></div></div>)}</div><div className="relative mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#2FD9C7]/12 bg-[#2FD9C7]/[.045] p-4"><Waves className="h-4 w-4 text-[#2FD9C7]" /><div className="mt-3 text-sm font-bold">Adaptive learning</div><div className="mt-1 text-xs leading-5 text-[#7A8595]">Insights inform what to practice next.</div></div><div className="rounded-xl border border-[#5B9EFF]/12 bg-[#5B9EFF]/[.045] p-4"><Globe2 className="h-4 w-4 text-[#5B9EFF]" /><div className="mt-3 text-sm font-bold">Regional context</div><div className="mt-1 text-xs leading-5 text-[#7A8595]">Support for multilingual scenarios and localized threats.</div></div></div></div>
          </div>
        </section>

        <section id="trust" className="border-y border-white/[0.06] bg-[#0F141C]/70"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#06D369]/15 bg-[#06D369]/[.06] text-[#06D369]"><LockKeyhole className="h-5 w-5" /></div><h2 className="mt-6 text-3xl font-black tracking-[-.04em]">Realism needs boundaries.</h2><p className="mt-4 text-base leading-7 text-[#A8B4C4]">PhishYou is built for authorized organizational security training—not punishment or unauthorized testing.</p></div><div className="grid gap-3 sm:grid-cols-2">{['Organizational authorization', 'Explicit consent workflows', 'Immutable audit trails', 'Mandatory post-campaign debriefs', 'Compliance-aware deployment', 'Training-focused outcomes'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-sm font-medium text-white/75"><ShieldCheck className="h-4 w-4 shrink-0 text-[#06D369]" />{item}</div>)}</div></div></div></section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"><div className="relative overflow-hidden rounded-[2rem] border border-[#2FD9C7]/15 bg-[radial-gradient(circle_at_20%_20%,rgba(47,217,199,.13),transparent_35%),linear-gradient(135deg,#121B21,#0D1118)] px-6 py-14 text-center shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:px-12"><div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" /><div className="relative mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#2FD9C7]">Security training for the AI era</p><h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">Turn realistic pressure into stronger habits.</h2><p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#A8B4C4]">Bring your security team closer to the behaviors, policies, and decisions that matter when the pressure is real.</p><button onClick={() => navigate('/login')} className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2FD9C7] px-6 py-3.5 text-sm font-bold text-[#07110F] shadow-[0_14px_40px_rgba(47,217,199,.16)] hover:-translate-y-0.5 hover:bg-[#5BE7D8]">Enter PhishYou <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div></div></section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-5 py-8 text-center text-xs text-white/35">PhishYou · Enterprise human risk intelligence · Authorized security simulations only</footer>
    </div>
  )
}
