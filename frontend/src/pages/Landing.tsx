import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, ChevronRight, LockKeyhole, Play, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const capabilities = [
  { icon: Target, label: 'Scenario orchestration', text: 'Design realistic multi-channel simulations without losing sight of consent and scope.' },
  { icon: BrainCircuit, label: 'Behavioral intelligence', text: 'Turn message interactions and response patterns into actionable security signals.' },
  { icon: BarChart3, label: 'After-action reporting', text: 'Move from campaign results to clear organizational lessons and coaching actions.' },
]

const signals = [
  { label: 'Suspicious link', value: 'Detected', width: '82%' },
  { label: 'Urgency pressure', value: 'High', width: '71%' },
  { label: 'Authority cue', value: 'Medium', width: '54%' },
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden bg-[#07100C] text-white selection:bg-emerald-300/30">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[8%] top-[-10%] h-[32rem] w-[32rem] rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute right-[-8%] top-[18%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.07] blur-[120px]" />
        <div className="absolute left-[40%] top-[58%] h-[22rem] w-[22rem] rounded-full bg-emerald-300/[0.05] blur-[110px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07100C]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-left" aria-label="PhishYou home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 transition duration-300 group-hover:scale-105 group-hover:border-emerald-300/40">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em]">PHISHYOU</span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/35">Human risk intelligence</span>
            </span>
          </button>
          <div className="hidden items-center gap-7 text-sm text-white/50 md:flex">
            <a href="#platform" className="transition hover:text-white">Platform</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#learning" className="transition hover:text-white">Learning</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="rounded-lg px-3 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Sign in</button>
            <button onClick={() => navigate('/signup')} className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07100C] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-200">Get started</button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-200 shadow-[0_0_40px_rgba(110,231,183,0.08)]">
                <Sparkles className="h-3.5 w-3.5" />
                Security awareness, built around behavior
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                See how people respond under pressure.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
                PhishYou simulates realistic social-engineering scenarios, analyzes human behavior in context, and turns every campaign into a sharper security program.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => navigate('/signup')} className="group inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-[#07100C] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-200">
                  Start a campaign <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate('/login')} className="group inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-3.5 text-sm font-medium text-white/78 transition duration-300 hover:border-white/22 hover:bg-white/[0.05] hover:text-white">
                  <Play className="h-4 w-4" /> Explore the platform
                </button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/35">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Consent-first workflows</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Multi-channel simulations</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/70" /> Actionable reporting</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-emerald-300/[0.06] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-white/32">Live campaign monitor</div>
                    <div className="mt-1 text-sm font-semibold">Q3 Finance Resilience</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Live</span>
                </div>
                <div className="grid gap-0 sm:grid-cols-[1.05fr_0.95fr]">
                  <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Targets', '248'],
                        ['Engaged', '61'],
                        ['Blocked', '187'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                          <div className="text-xl font-semibold">{value}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-white/32">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-xl border border-white/8 bg-[#0A1510] p-4">
                      <div className="flex items-center justify-between text-xs"><span className="text-white/42">Resistance score</span><span className="font-semibold text-emerald-200">74 / 100</span></div>
                      <div className="mt-3 h-2 rounded-full bg-white/8"><div className="h-full w-[74%] rounded-full bg-emerald-300 transition-all duration-1000" /></div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {signals.map((signal) => (
                          <div key={signal.label}>
                            <div className="flex justify-between text-[10px]"><span className="text-white/35">{signal.label}</span><span className="text-white/55">{signal.value}</span></div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-white/7"><div className="h-full rounded-full bg-cyan-300/70" style={{ width: signal.width }} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-white/40"><span>Behavioral timeline</span><ChevronRight className="h-4 w-4" /></div>
                    <div className="mt-5 space-y-4">
                      {[
                        ['08:42', 'Email opened', 'Finance persona'],
                        ['08:49', 'Link inspected', 'No click'],
                        ['08:53', 'Message blocked', 'Policy triggered'],
                        ['09:01', 'Learning assigned', 'Adaptive coaching'],
                      ].map(([time, title, meta], i) => (
                        <div key={title} className="group relative flex gap-3">
                          {i < 3 && <span className="absolute left-[5px] top-4 h-8 w-px bg-white/8" />}
                          <span className={`relative mt-1 h-3 w-3 shrink-0 rounded-full border ${i === 2 ? 'border-emerald-300/70 bg-emerald-300/30 shadow-[0_0_16px_rgba(110,231,183,0.4)]' : 'border-white/15 bg-white/5'}`} />
                          <div className="min-w-0"><div className="text-xs font-medium text-white/78">{title}</div><div className="mt-0.5 text-[10px] text-white/34">{time} · {meta}</div></div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-xl border border-emerald-300/12 bg-emerald-300/[0.06] p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-100"><Zap className="h-3.5 w-3.5" /> Recommended next action</div>
                      <div className="mt-2 text-sm leading-5 text-white/62">Assign “Pressure Tactics” learning to Finance before the next simulation.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/75">One platform, one feedback loop</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Simulate. Understand. Improve.</h2>
            <p className="mt-4 text-base leading-7 text-white/50">Everything is designed to move security teams from “we ran a phishing test” to “we know where the human risk is and what to do next.”</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, label, text }, index) => (
              <article key={label} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-white/[0.05]">
                <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-200"><Icon className="h-5 w-5" /></span><span className="text-xs text-white/25">0{index + 1}</span></div>
                <h3 className="mt-6 text-lg font-semibold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-white/50 transition group-hover:text-emerald-200">See how it works <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></div>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-white/10 bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/75">Designed for the full lifecycle</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From first signal to lasting habit.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">The product connects campaign orchestration, behavioral analysis, reporting, and learning so every stage informs the next.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['01', 'Define the scope', 'Set organizational consent, targets, vectors, and simulation boundaries.'],
                ['02', 'Run the scenario', 'Launch coordinated interactions while keeping the experience observable and controlled.'],
                ['03', 'Read the behavior', 'Understand the signals, triggers, resistance, and policy gaps behind every response.'],
                ['04', 'Coach the next move', 'Turn findings into targeted learning and a stronger follow-up campaign.'],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-[#09130F] p-5 transition duration-300 hover:border-white/18">
                  <div className="text-xs font-semibold tracking-[0.16em] text-emerald-300/60">{number}</div>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/42">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="learning" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="overflow-hidden rounded-[1.8rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-300/10 via-white/[0.025] to-cyan-300/[0.04] p-6 sm:p-9">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"><Users className="h-4 w-4" /> Adaptive learning</div>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Don’t stop at the simulation. Build the instinct.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">A focused learning path turns behavioral findings into short, contextual practice. People learn the pattern they just encountered—while it is still fresh.</p>
              </div>
              <button onClick={() => navigate('/learning')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#07100C] transition duration-300 hover:-translate-y-0.5 hover:bg-white/90">Explore Learning <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-7 text-center sm:p-12">
            <LockKeyhole className="mx-auto h-7 w-7 text-emerald-200" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Make human risk measurable—and actionable.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/45">Bring simulations, intelligence, reporting, and learning into one calm operational loop.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/signup')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-[#07100C] transition hover:bg-emerald-200">Start with PhishYou <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => navigate('/login')} className="rounded-xl border border-white/12 px-5 py-3.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">Sign in</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-white/30 sm:flex-row"><span>PhishYou · Human risk intelligence</span><span>Security simulations with consent, context, and accountability.</span></div>
      </footer>
    </div>
  )
}
