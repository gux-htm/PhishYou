import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, ChevronRight, LockKeyhole, Play, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const capabilities = [
  { icon: Target, label: 'Scenario orchestration', text: 'Design realistic multi-channel simulations with clear consent boundaries and controlled scope.' },
  { icon: BrainCircuit, label: 'Behavioral intelligence', text: 'Turn response patterns into measurable signals about resistance, risk, and policy gaps.' },
  { icon: BarChart3, label: 'After-action reporting', text: 'Move from campaign outcomes to precise findings, coaching, and the next defensive move.' },
]

const signalRows = [
  ['Authority pressure', '72%', 'High', 'bg-[#FF4757]'],
  ['Urgency pressure', '64%', 'Medium', 'bg-[#F59E0B]'],
  ['Verification behavior', '84%', 'Strong', 'bg-[#06D369]'],
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden bg-[#0F1219] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="py-grid-noise absolute inset-0 opacity-60" />
        <div className="absolute left-[3%] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#2FD9C7]/10 blur-[120px]" />
        <div className="absolute right-[-10rem] top-[15%] h-[30rem] w-[30rem] rounded-full bg-[#06D369]/[0.05] blur-[120px]" />
      </div>

      <header className="relative z-30 border-b border-white/[0.08] bg-[#0F1219]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <button onClick={() => navigate('/')} className="group flex min-h-11 items-center gap-3 text-left" aria-label="PhishYou home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/10 text-[#2FD9C7] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#2FD9C7]/40 group-hover:shadow-[0_0_24px_rgba(47,217,199,0.12)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-[0.18em]">PHISHYOU</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">Human risk intelligence</span>
            </span>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-white/45 md:flex" aria-label="Primary navigation">
            <a href="#platform" className="transition hover:text-white">Platform</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#learning" className="transition hover:text-white">Learning</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.04] hover:text-white">Sign in</button>
            <button onClick={() => navigate('/signup')} className="min-h-11 rounded-lg bg-[#2FD9C7] px-4 py-2 text-sm font-bold text-[#0F1219] shadow-[0_8px_28px_rgba(47,217,199,0.12)] hover:-translate-y-0.5 hover:bg-[#4FE5D3]">Get started</button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="py-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.07] px-3.5 py-2 text-xs font-semibold text-[#8FEFE3]">
                <Sparkles className="h-3.5 w-3.5" />
                Security awareness, built around behavior
              </div>
              <h1 className="mt-6 max-w-4xl text-[clamp(3.5rem,7vw,5.75rem)] font-black leading-[0.95] tracking-[-0.055em]">
                Measure the human risk behind the click.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#A8B4C4] sm:text-lg sm:leading-8">
                PhishYou runs consent-first social-engineering simulations, observes how people respond under realistic pressure, and turns those signals into better security decisions.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => navigate('/signup')} className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2FD9C7] px-5 py-3.5 text-sm font-bold text-[#0F1219] shadow-[0_12px_32px_rgba(47,217,199,0.12)] hover:-translate-y-0.5 hover:bg-[#4FE5D3] active:translate-y-0">
                  Start a campaign <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate('/login')} className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#3D4860] bg-[#15191F]/80 px-5 py-3.5 text-sm font-semibold text-[#F5F7FB] hover:-translate-y-0.5 hover:border-[#2FD9C7]/50 hover:bg-[#2FD9C7]/[0.05]">
                  <Play className="h-4 w-4 text-[#2FD9C7]" /> Explore the platform
                </button>
              </div>

              <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
                {['Consent-first', 'Multi-channel', 'Actionable AAR'].map((item, index) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[#A8B4C4]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#06D369]" />
                    <span>{item}</span>
                    <span className="ml-auto text-[10px] font-mono text-white/20">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative py-fade-up py-fade-up-delay-2">
              <div className="absolute -inset-8 rounded-[2.5rem] bg-[#2FD9C7]/[0.055] blur-3xl" />
              <div className="py-sheen py-glass relative rounded-[1.6rem] shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
                <div className="flex items-center justify-between border-b border-[#2D3748]/80 px-5 py-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7A8595]">Live campaign monitor</div>
                    <div className="mt-1 text-sm font-bold">Finance resilience · Q3</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#06D369]/10 px-2.5 py-1 text-[11px] font-semibold text-[#06D369]">
                    <span className="py-pulse-live h-1.5 w-1.5 rounded-full bg-[#06D369]" /> Live
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="border-b border-[#2D3748]/80 p-5 lg:border-b-0 lg:border-r">
                    <div className="grid grid-cols-3 gap-2">
                      {[['Targets', '248'], ['Engaged', '61'], ['Defended', '187']].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#3D4860]/50 bg-[#1D232D]/75 p-3">
                          <div className="text-xl font-black tracking-tight">{value}</div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A8595]">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl border border-[#3D4860]/50 bg-[#0F1219]/70 p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#7A8595]">Resistance score</span>
                        <span className="font-mono font-bold text-[#2FD9C7]">74 / 100</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#232D39]">
                        <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#2FD9C7] to-[#06D369] transition-all duration-1000" />
                      </div>

                      <div className="mt-5 space-y-3">
                        {signalRows.map(([name, value, strength, color]) => (
                          <div key={name}>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#A8B4C4]">{name}</span>
                              <span className="font-semibold text-white/65">{strength}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#232D39]"><div className={`h-full rounded-full ${color}`} style={{ width: value }} /></div>
                              <span className="w-9 text-right font-mono text-[10px] text-[#7A8595]">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8595]">
                      Behavioral timeline <ChevronRight className="h-4 w-4" />
                    </div>
                    <div className="mt-5 space-y-4">
                      {[
                        ['08:42', 'Email opened', 'Finance persona', false],
                        ['08:49', 'Link inspected', 'No click', false],
                        ['08:53', 'Sender blocked', 'Policy triggered', true],
                        ['09:01', 'Learning assigned', 'Adaptive coaching', false],
                      ].map(([time, title, meta, active], index) => (
                        <div key={title} className="relative flex gap-3">
                          {index < 3 && <span className="absolute left-[5px] top-4 h-8 w-px bg-[#2D3748]" />}
                          <span className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full border ${active ? 'border-[#2FD9C7] bg-[#2FD9C7]/30 shadow-[0_0_18px_rgba(47,217,199,0.22)]' : 'border-[#3D4860] bg-[#232D39]'}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#F5F7FB]">{title}</div>
                            <div className="mt-0.5 text-[10px] text-[#7A8595]">{time} · {meta}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-7 rounded-xl border border-[#2FD9C7]/15 bg-[#2FD9C7]/[0.045] p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#9EF1E5]"><Zap className="h-3.5 w-3.5" /> Recommended next action</div>
                      <div className="mt-2 text-sm leading-5 text-[#A8B4C4]">Assign “Pressure Tactics” learning to Finance before the next simulation.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="max-w-3xl py-fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2FD9C7]">One feedback loop</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">Simulate. Understand. Improve.</h2>
            <p className="mt-4 text-base leading-7 text-[#A8B4C4]">A simulation is only useful when the result changes the next decision. PhishYou connects the operational, behavioral, reporting, and learning layers in one loop.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, label, text }, index) => (
              <article key={label} className="py-sheen group rounded-2xl border border-[#2D3748] bg-[#15191F] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#2FD9C7]/35 hover:shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2FD9C7]/15 bg-[#2FD9C7]/[0.06] text-[#2FD9C7]"><Icon className="h-5 w-5" /></span>
                  <span className="font-mono text-xs text-white/20">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-lg font-bold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#A8B4C4]">{text}</p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-white/45 transition group-hover:text-[#2FD9C7]">See the workflow <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#2D3748] bg-[#15191F]/45">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2FD9C7]">Designed for the full lifecycle</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">From first signal to stronger habit.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#A8B4C4]">Scope the simulation, observe the behavior, understand the why, and turn the result into practical defensive training.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['01', 'Define the scope', 'Set targets, consent, vectors, and clear simulation boundaries.'],
                ['02', 'Run the scenario', 'Coordinate realistic interactions while keeping every engagement observable.'],
                ['03', 'Read the behavior', 'Surface resistance, triggers, harm signals, and organizational policy gaps.'],
                ['04', 'Coach the next move', 'Turn evidence into focused learning and a smarter follow-up campaign.'],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-[#2D3748] bg-[#111827] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860]">
                  <div className="font-mono text-xs font-bold tracking-[0.16em] text-[#2FD9C7]/70">{number}</div>
                  <h3 className="mt-5 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#A8B4C4]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="learning" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[1.8rem] border border-[#2FD9C7]/15 bg-gradient-to-br from-[#2FD9C7]/10 via-[#15191F] to-[#06D369]/[0.04] p-7 sm:p-10">
            <div className="absolute right-[-5rem] top-[-5rem] h-52 w-52 rounded-full bg-[#2FD9C7]/[0.08] blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9EF1E5]"><Users className="h-4 w-4" /> Adaptive learning</div>
                <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">Don’t stop at the simulation. Build the instinct.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A8B4C4]">Campaign findings can become focused learning moments—short, relevant, and tied to the behaviors your organization actually observed.</p>
              </div>
              <button onClick={() => navigate('/learning')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F5F7FB] px-5 py-3 text-sm font-bold text-[#0F1219] hover:-translate-y-0.5 hover:bg-white">Explore learning <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="rounded-[1.8rem] border border-[#2D3748] bg-[#15191F] p-8 text-center sm:p-12">
            <LockKeyhole className="mx-auto h-7 w-7 text-[#2FD9C7]" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">Make human risk measurable—and actionable.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#A8B4C4]">Bring simulations, behavioral intelligence, reporting, and learning into one controlled operational loop.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/signup')} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2FD9C7] px-5 py-3.5 text-sm font-bold text-[#0F1219] hover:-translate-y-0.5 hover:bg-[#4FE5D3]">Start with PhishYou <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => navigate('/login')} className="min-h-12 rounded-xl border border-[#3D4860] px-5 py-3.5 text-sm font-semibold text-[#F5F7FB] hover:border-[#2FD9C7]/50 hover:bg-[#2FD9C7]/[0.05]">Sign in</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#2D3748] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-[#7A8595] sm:flex-row">
          <span>PhishYou · Human risk intelligence</span>
          <span>Security simulations with consent, context, and accountability.</span>
        </div>
      </footer>
    </div>
  )
}
