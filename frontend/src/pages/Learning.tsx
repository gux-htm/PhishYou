import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const modules = [
  { title: 'Spot the Signal', description: 'Learn the subtle signs that separate a legitimate request from a social-engineering attempt.', duration: '8 min', progress: 100 },
  { title: 'Pressure Tactics', description: 'Recognize urgency, authority, fear, and social-proof cues before they shape your decision.', duration: '10 min', progress: 72 },
  { title: 'Message Anatomy', description: 'Break down email, chat, and collaboration messages layer by layer.', duration: '12 min', progress: 38 },
  { title: 'Your First Response', description: 'Practice a safe response pattern when a request feels suspicious.', duration: '9 min', progress: 0 },
]

export function Learning() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#08110D] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-32 top-12 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -left-24 top-[42%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#08110D]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-white">PHISHYOU</span>
              <span className="block text-xs text-white/45">Security learning</span>
            </span>
          </button>
          <button onClick={() => navigate('/login')} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-emerald-300/30 hover:text-white">
            Back to app
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-20">
        <section className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Learn from what the campaign revealed
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Turn every simulation into a stronger security instinct.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              PhishYou Learning converts campaign findings into short, practical lessons so people can understand the signal, make a safer decision, and build better habits over time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#08110D] transition hover:-translate-y-0.5 hover:bg-emerald-200">
                Continue learning <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5 hover:text-white">
                Explore all modules
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Readiness progress</span>
              <span className="text-sm font-semibold text-emerald-200">63%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[63%] rounded-full bg-emerald-300 transition-all duration-700" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-2xl font-semibold">3</div>
                <div className="mt-1 text-xs text-white/40">Lessons done</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-2xl font-semibold">21m</div>
                <div className="mt-1 text-xs text-white/40">Practice time</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-2xl font-semibold">+14</div>
                <div className="mt-1 text-xs text-white/40">Readiness points</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Your path</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Learn the patterns that matter most</h2>
            </div>
            <span className="text-sm text-white/40">4 modules</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => {
              const locked = index === modules.length - 1 && module.progress === 0
              const complete = module.progress === 100
              return (
                <article key={module.title} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.055]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-200">
                      {complete ? <CheckCircle2 className="h-5 w-5" /> : locked ? <LockKeyhole className="h-5 w-5" /> : <BookOpenCheck className="h-5 w-5" />}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/45">
                      <Clock3 className="h-3 w-3" /> {module.duration}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{module.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/50">{module.description}</p>
                  <div className="mt-5 flex items-center justify-between text-xs text-white/40">
                    <span>{complete ? 'Complete' : locked ? 'Unlocks next' : `${module.progress}% complete`}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${module.progress}%` }} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/10 via-white/[0.03] to-cyan-300/5 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200"><Sparkles className="h-4 w-4" /> Adaptive coaching</div>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold text-white sm:text-3xl">Your next lesson should reflect your latest behavior.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Use the insights from campaign simulations to focus practice where your organization needs it most—without burying people in long courses.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#08110D] transition hover:-translate-y-0.5 hover:bg-white/90">
              View recommended lesson <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
