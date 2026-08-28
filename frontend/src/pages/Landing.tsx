import { useEffect, useState } from 'react'
import { ArrowRight, BrainCircuit, Check, ChevronRight, Eye, FileSearch, Globe2, LockKeyhole, Play, Radar, ShieldCheck, Sparkles, Target, Users, Waves } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const channels = ['EMAIL', 'WHATSAPP', 'SMS', 'VOICE', 'LINKEDIN', 'INSTAGRAM']
const signals = [
  ['01', 'SIMULATE', 'Authorized multi-turn scenarios that adapt to resistance and verification behavior.'],
  ['02', 'OBSERVE', 'Behavioral signals reveal how people respond under realistic pressure.'],
  ['03', 'STRENGTHEN', 'After-action intelligence turns evidence into better policies and coaching.'],
]

function ThreatSurface() {
  const [tilt, setTilt] = useState({ x: -5, y: 7 })
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % channels.length), 1800)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className="relative mx-auto h-[430px] w-full max-w-[640px] select-none [perspective:1400px] sm:h-[540px]"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - .5
        const y = (event.clientY - rect.top) / rect.height - .5
        setTilt({ x: -5 - y * 8, y: 7 + x * 12 })
      }}
      onMouseLeave={() => setTilt({ x: -5, y: 7 })}
    >
      <div className="absolute inset-[7%] rounded-full border border-[#ff365f]/15 [transform:rotateX(68deg)]" />
      <div className="py-red-orbit absolute inset-[12%] rounded-full border border-[#ff365f]/35 [transform-style:preserve-3d]" />
      <div className="py-red-orbit-reverse absolute inset-[24%] rounded-full border border-[#2fd9c7]/20 [transform-style:preserve-3d]" />
      <div className="absolute inset-[17%] rounded-full border border-white/[0.05] [transform:rotateY(70deg)]" />
      <div className="py-red-scan absolute inset-[13%] rounded-full bg-[conic-gradient(from_210deg,transparent_0deg,rgba(255,54,95,.24)_28deg,transparent_75deg)] blur-lg" />
      <div className="absolute inset-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,54,95,.10),transparent_65%)] blur-3xl" />

      <div
        className="relative left-[11%] top-[20%] h-[58%] w-[78%] border border-white/[0.14] bg-[#e8e6df] p-1 shadow-[0_40px_100px_rgba(0,0,0,.62)] transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="absolute left-0 top-0 h-1.5 w-20 bg-[#ff365f]" />
        <div className="absolute bottom-0 right-0 h-1.5 w-24 bg-[#ff365f]" />
        <div className="h-full border border-black/10 bg-[repeating-linear-gradient(0deg,rgba(10,13,19,.045)_0px,rgba(10,13,19,.045)_1px,transparent_1px,transparent_4px)] p-5 text-[#0b0d12] sm:p-7">
          <div className="flex items-start justify-between border-b border-black/10 pb-4">
            <div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[.24em] text-black/45">PhishYou // live intelligence</div>
              <div className="mt-2 text-xs font-black tracking-[.18em]">HUMAN RISK SURFACE</div>
            </div>
            <Radar className="h-5 w-5 text-[#e82e55]" />
          </div>

          <div className="mt-7 flex items-end justify-between gap-3">
            <div><div className="font-mono text-[9px] uppercase tracking-widest text-black/40">Campaign</div><div className="mt-1 text-sm font-black">FINANCE / Q3</div></div>
            <div className="rounded-full bg-[#0b0d12] px-2.5 py-1 font-mono text-[9px] font-bold text-[#e8e6df]">LIVE</div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[['248', 'TARGETS'], ['61', 'ENGAGED'], ['74%', 'RESILIENCE']].map(([value, label]) => <div key={label} className="border border-black/10 bg-white/45 p-2.5"><div className="text-lg font-black tracking-tight">{value}</div><div className="mt-1 font-mono text-[7px] font-bold tracking-wider text-black/45">{label}</div></div>)}
          </div>

          <div className="mt-6 border-t border-black/10 pt-4">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider"><span className="text-black/45">Active vector</span><span className="text-[#d61e46]">{channels[active]}</span></div>
            <div className="mt-3 flex gap-1">{channels.map((channel, index) => <span key={channel} className={`h-1 flex-1 ${index === active ? 'bg-[#e82e55]' : 'bg-black/10'} transition-all duration-500`} />)}</div>
          </div>
        </div>
      </div>

      <div className="py-float-red absolute left-0 top-[14%] border border-[#ff365f]/25 bg-[#0f1118]/85 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-[.16em] text-[#ff718b]"><Eye className="h-3.5 w-3.5" /> BEHAVIORAL SIGNAL</div>
        <div className="mt-2 text-xs text-white/55">Verification detected</div>
      </div>
      <div className="py-float-red absolute bottom-[13%] right-0 border border-[#2fd9c7]/20 bg-[#0f1118]/85 px-4 py-3 shadow-2xl backdrop-blur-xl [animation-delay:-2.4s]">
        <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-[.16em] text-[#7ce9dd]"><ShieldCheck className="h-3.5 w-3.5" /> DEFENSE SIGNAL</div>
        <div className="mt-2 text-xs text-white/55">Out-of-band check</div>
      </div>
    </div>
  )
}

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden bg-[#09090d] text-[#f4f1ea]">
      <div className="pointer-events-none fixed inset-0 py-hud-grid opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,54,95,.14),transparent_64%)]" />

      <header className="relative z-30 border-b border-white/[0.08] bg-[#09090d]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-left" aria-label="PhishYou home">
            <span className="relative flex h-10 w-10 items-center justify-center border border-[#ff365f]/40 bg-[#ff365f]/10 text-[#ff5877] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_0_30px_rgba(255,54,95,.18)]"><ShieldCheck className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-2 w-2 bg-[#ff365f]" /></span>
            <span><span className="block text-sm font-black tracking-[.2em]">PHISHYOU</span><span className="mt-0.5 block font-mono text-[8px] font-bold uppercase tracking-[.22em] text-white/35">Adversarial resilience intelligence</span></span>
          </button>

          <nav className="hidden items-center gap-8 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-white/45 md:flex">
            <a href="#platform" className="hover:text-[#ff718b]">Platform</a><a href="#intelligence" className="hover:text-[#ff718b]">Intelligence</a><a href="#trust" className="hover:text-[#ff718b]">Trust</a>
          </nav>

          <div className="flex items-center gap-2"><button onClick={() => navigate('/login')} className="px-3 py-2 text-sm text-white/55 hover:text-white">Sign in</button><button onClick={() => navigate('/login')} className="group border border-[#ff365f] bg-[#ff365f] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_12px_30px_rgba(255,54,95,.18)] transition hover:-translate-y-0.5 hover:bg-[#ff4d6c]">Request access <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></button></div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="mb-8 flex items-center justify-between border-y border-white/[0.07] py-3 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-white/35"><span>System status: authorized simulation</span><span className="hidden sm:block">Enterprise security training / 2026</span></div>
          <div className="grid items-center gap-10 lg:grid-cols-[.96fr_1.04fr] lg:gap-14">
            <div className="py-reveal">
              <div className="inline-flex items-center gap-2 border border-[#ff365f]/25 bg-[#ff365f]/[.06] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#ff7b93]"><Sparkles className="h-3.5 w-3.5" /> Built for authorized resilience testing</div>
              <h1 className="mt-8 max-w-3xl text-[clamp(3.7rem,7.2vw,6.7rem)] font-black leading-[.86] tracking-[-.075em] text-white">Train for the attack that <span className="text-[#ff4567]">thinks back.</span></h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-[#a8acb8] sm:text-lg">PhishYou runs consent-first, multi-turn social-engineering simulations that adapt to human behavior, then turns every interaction into defensive intelligence your organization can use.</p>
              <div className="mt-9 flex flex-wrap gap-3"><button onClick={() => navigate('/login')} className="group inline-flex items-center gap-2 border border-[#ff365f] bg-[#ff365f] px-5 py-3.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,54,95,.18)] hover:-translate-y-0.5 hover:bg-[#ff4d6c]">Enter the platform <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button><a href="#platform" className="inline-flex items-center gap-2 border border-white/[.13] bg-white/[.025] px-5 py-3.5 text-sm font-semibold text-white/80 hover:border-[#ff365f]/50 hover:bg-[#ff365f]/[.05]"><Play className="h-4 w-4 text-[#ff5877]" /> Explore the system</a></div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/[.08] pt-6">{[['06', 'CHANNELS'], ['∞', 'CONVERSATIONS'], ['01', 'DEFENSIVE LOOP']].map(([value, label]) => <div key={label}><div className="font-mono text-2xl font-bold text-white">{value}</div><div className="mt-1 font-mono text-[8px] font-bold tracking-[.16em] text-white/35">{label}</div></div>)}</div>
            </div>
            <div className="py-reveal py-reveal-delay"><ThreatSurface /></div>
          </div>
        </section>

        <section id="platform" className="relative border-y border-white/[.07] bg-[#0d0d12]/90 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-20"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#ff5877]">The defensive feedback loop</p><h2 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">Pressure reveals what policies hide.</h2></div><p className="max-w-2xl self-end text-base leading-8 text-[#a8acb8]">A click is only an outcome. PhishYou focuses on the decisions before it: hesitation, resistance, verification, escalation, and the organizational procedures that either help or fail under pressure.</p></div>
            <div className="mt-14 grid gap-px overflow-hidden border border-white/[.08] bg-white/[.08] md:grid-cols-3">{signals.map(([number, title, copy], index) => <article key={title} className="group bg-[#0d0d12] p-7 transition hover:bg-[#121118]"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#ff5877]">{number}</span><ChevronRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-[#ff5877]" /></div><h3 className="mt-12 text-xl font-black tracking-tight">{title}</h3><p className="mt-4 text-sm leading-7 text-[#8d929f]">{copy}</p><div className={`mt-7 h-px w-full ${index === 1 ? 'bg-[#2fd9c7]/50' : 'bg-[#ff365f]/50'}`} /></article>)}</div>
          </div>
        </section>

        <section id="intelligence" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div className="py-hud-frame bg-[#0e0e14] p-2"><div className="border border-white/[.07] p-5 sm:p-8"><div className="flex items-center justify-between border-b border-white/[.08] pb-5"><div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-white/35">After-action intelligence</div><div className="mt-2 text-lg font-black">WHAT THE CAMPAIGN TAUGHT YOU</div></div><FileSearch className="h-6 w-6 text-[#ff5877]" /></div><div className="mt-7 space-y-4">{[['Behavioral resilience', 'Employees verified through the right channel before acting.', '74%', '#2fd9c7'], ['Policy gap', 'Payment verification workflow was unclear under urgency.', 'HIGH', '#ff5877'], ['Next move', 'Coach verification protocol and retest the Finance team.', 'READY', '#f0b84b']].map(([title, copy, status, color]) => <div key={title} className="border-l-2 bg-white/[.025] p-4" style={{ borderColor: color }}><div className="flex justify-between gap-4"><div className="text-sm font-bold">{title}</div><span className="font-mono text-[9px] font-bold" style={{ color }}>{status}</span></div><p className="mt-2 text-sm leading-6 text-white/45">{copy}</p></div>)}</div></div></div><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#2fd9c7]">Beyond awareness metrics</p><h2 className="mt-5 text-4xl font-black leading-[.96] tracking-[-.05em] sm:text-6xl">Know what changed, not just who clicked.</h2><p className="mt-7 max-w-xl text-base leading-8 text-[#a8acb8]">PhishYou connects behavioral evidence, psychological triggers, policy gaps, and coaching recommendations into a single learning loop for security teams.</p><div className="mt-9 space-y-4">{['Behavioral resilience scoring', 'Psychological trigger analysis', 'Policy gap identification', 'Targeted learning recommendations'].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-white/75"><span className="flex h-5 w-5 items-center justify-center border border-[#2fd9c7]/30 text-[#2fd9c7]"><Check className="h-3 w-3" /></span>{item}</div>)}</div></div></div>
        </section>

        <section id="trust" className="border-y border-white/[.07] bg-[radial-gradient(circle_at_20%_0%,rgba(47,217,199,.08),transparent_38%),#0c0c11]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#7ce9dd]"><LockKeyhole className="h-4 w-4" /> Enterprise control plane</div><h2 className="mt-6 max-w-3xl text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">Realism without losing the right to stop.</h2><p className="mt-7 max-w-2xl text-base leading-8 text-[#a8acb8]">PhishYou is built for authorized organizations, with consent, auditability, campaign controls, and mandatory learning at the center of the product experience.</p><button onClick={() => navigate('/login')} className="mt-9 inline-flex items-center gap-2 border-b border-[#2fd9c7]/60 pb-2 text-sm font-bold text-[#b9fff7] hover:text-white">See the platform <ArrowRight className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-3">{[[ShieldCheck, 'Consent-first'], [LockKeyhole, 'Controlled access'], [Globe2, 'Regional language'], [Users, 'Enterprise teams']].map(([Icon, label]) => { const IconComponent = Icon as typeof ShieldCheck; return <div key={label as string} className="border border-white/[.08] bg-white/[.025] p-5"><IconComponent className="h-5 w-5 text-[#2fd9c7]" /><div className="mt-8 text-sm font-bold">{label as string}</div></div> })}</div></div>
        </section>

        <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8 sm:py-32"><div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-[#ff365f]/60 to-transparent" /><div className="py-red-halo pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff365f]/[.07] blur-[100px]" /><div className="relative mx-auto max-w-3xl"><p className="font-mono text-[10px] font-bold uppercase tracking-[.24em] text-[#ff5877]">Build resilience before it matters</p><h2 className="mt-6 text-4xl font-black leading-[.92] tracking-[-.055em] sm:text-6xl">The next attack will be adaptive. Your training should be too.</h2><p className="mx-auto mt-7 max-w-xl text-base leading-8 text-[#9ba0ad]">Bring your security team closer to the human decisions that determine whether a real attack succeeds or fails.</p><button onClick={() => navigate('/login')} className="mt-10 inline-flex items-center gap-2 border border-[#ff365f] bg-[#ff365f] px-6 py-4 text-sm font-black text-white shadow-[0_20px_45px_rgba(255,54,95,.18)] hover:-translate-y-0.5 hover:bg-[#ff4d6c]">Request enterprise access <ArrowRight className="h-4 w-4" /></button></div></section>
      </main>

      <footer className="relative z-10 border-t border-white/[.07] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 font-mono text-[9px] uppercase tracking-[.14em] text-white/30 sm:flex-row"><span>PHISHYOU // Human resilience intelligence</span><span>Authorized security simulation only</span></div></footer>
    </div>
  )
}
