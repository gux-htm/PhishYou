/**
 * PhishYou — Not Found Page (404 catch-all)
 * Spec: FRONTEND_SPEC_ENHANCED.md — Application Routes (catch-all) +
 *       Global Components → Empty States pattern.
 */
import { ArrowLeft, Compass, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0D13] px-6 py-16 text-center text-white">
      <div className="pointer-events-none absolute inset-0 py-grid-noise opacity-50" />
      <div className="pointer-events-none absolute inset-0 py-topology opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2FD9C7]/[0.07] blur-[140px]" />

      <div className="relative w-full max-w-xl py-fade-up">
        <Link to="/" className="mx-auto inline-flex items-center gap-3 text-left" aria-label="PhishYou home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.07] text-[#2FD9C7] shadow-[0_0_28px_rgba(47,217,199,.08)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-black tracking-[.18em]">PHISHYOU</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.16em] text-white/30">Human risk intelligence</span>
          </span>
        </Link>

        <section className="py-signal-frame mt-10 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#111720]/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5B9EFF]/20 bg-[#5B9EFF]/[0.06] text-[#5B9EFF]">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[.24em] text-[#2FD9C7]">Route unavailable · 404</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-.055em] sm:text-6xl">Lost signal.</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#7A8595]">
            <span className="font-mono text-[#A8B4C4]">{location.pathname}</span> isn&apos;t an available PhishYou route. It may have moved, expired, or require a valid workspace path.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3D4860] bg-white/[0.025] px-4 py-2.5 text-sm font-semibold text-[#A8B4C4] hover:border-[#2FD9C7]/35 hover:bg-[#2FD9C7]/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2FD9C7] px-4 py-2.5 text-sm font-bold text-[#07110F] shadow-[0_12px_32px_rgba(47,217,199,.13)] hover:-translate-y-0.5 hover:bg-[#5BE7D8]"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Open Command Center
            </Link>
          </div>
        </section>

        <p className="mt-6 text-xs text-white/25">Authorized security simulation platform · Enterprise access only</p>
      </div>
    </main>
  );
}
