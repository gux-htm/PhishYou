/**
 * PhishYou — Not Found Page (404 catch-all)
 * Spec: FRONTEND_SPEC_ENHANCED.md — Application Routes (catch-all) +
 *       Global Components → Empty States pattern.
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Empty states (centered icon,
 * heading, description, CTA).
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Shield } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0F1219] flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Wordmark */}
      <div className="flex items-center gap-2 mb-10">
        <Shield className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
        <span className="text-lg font-black tracking-tight text-white">PhishYou</span>
      </div>

      <Compass className="w-12 h-12 text-slate-600 mb-4" aria-hidden="true" />

      <p className="text-6xl font-black tracking-tight text-white">404</p>
      <h1 className="text-lg font-semibold text-slate-400 mt-3">Page not found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        The page <span className="font-mono text-slate-400">{location.pathname}</span> doesn't exist or may have
        been moved. If you followed a link from a campaign report, it may have expired.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 ease-out hover:bg-[#232D39] active:scale-[0.98]"
        >
          Go Back
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-semibold text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] hover:scale-[1.02] active:scale-[0.98]"
        >
          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
