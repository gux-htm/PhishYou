/**
 * PhishYou — application shell (AppShell).
 * Spec: FRONTEND_SPEC_ENHANCED.md — Shared Layout Components: <AppShell>.
 *
 * Persistent wrapper rendered on every authenticated page (all routes
 * except /login): fixed left sidebar (w-64, hidden on mobile), fixed top
 * header (h-16), mobile bottom navigation (< 768px) and the routed page
 * via <Outlet />. Navigation only links to implemented pages — placeholder
 * routes (campaign list, analytics, audit, …) resolve to NotFound.
 *
 * Demo chrome (notifications, live indicator, signed-in user) mirrors the
 * Users.tsx roster (Imran Qureshi — Security Manager) and the Targets /
 * LiveCampaignMonitor demo campaign ids.
 */
import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Plug,
  Settings,
  Shield,
  ShieldOff,
  UserCheck,
  Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */

const ORG_NAME = 'Meridian Financial Group';
const CURRENT_USER = { name: 'Imran Qureshi', role: 'Security Manager', initials: 'IQ' };
const LIVE_CAMPAIGN_PATH = '/campaigns/camp_2026_08_27_001/live';
const LIVE_CAMPAIGN_COUNT = 2;

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
      { to: LIVE_CAMPAIGN_PATH, label: 'Live Monitor', icon: Activity },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/targets', label: 'Targets', icon: UserCheck },
      { to: '/organization', label: 'Organization', icon: Building2 },
      { to: '/users', label: 'Team & Roles', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/settings/integrations', label: 'Integrations', icon: Plug },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

const MOBILE_TABS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/targets', label: 'Targets', icon: UserCheck },
  { to: '/ai-assistant', label: 'AI', icon: Bot },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/* ------------------------------------------------------------------ */
/* Notifications (demo chrome — spec: Notification Popover)             */
/* ------------------------------------------------------------------ */

const NOTIFICATION_META: Record<string, { icon: LucideIcon; color: string }> = {
  HARM_DETECTED: { icon: AlertTriangle, color: '#FF4757' },
  CAMPAIGN_COMPLETED: { icon: CheckCircle2, color: '#06D369' },
  TARGET_BLOCKED: { icon: ShieldOff, color: '#A78BFA' },
  DEBRIEF_OVERDUE: { icon: Clock, color: '#F59E0B' },
  ADMIN_ACTION: { icon: Info, color: '#5B9EFF' },
};

interface Notification {
  id: number;
  type: keyof typeof NOTIFICATION_META;
  title: string;
  at: string;
  message: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'HARM_DETECTED',
    title: 'High-distress signals detected',
    at: '12 minutes ago',
    message: 'Grace Nolan showed distress markers — the campaign paused and offered an opt-out automatically.',
  },
  {
    id: 2,
    type: 'CAMPAIGN_COMPLETED',
    title: 'Campaign completed',
    at: '1 hour ago',
    message: 'Vendor Invoice Fraud Simulation finished — the After-Action Report is ready for review.',
  },
  {
    id: 3,
    type: 'TARGET_BLOCKED',
    title: 'Target blocked the sender',
    at: '3 hours ago',
    message: 'Hina Yusuf blocked the simulated address and reported the thread to IT.',
  },
  {
    id: 4,
    type: 'DEBRIEF_OVERDUE',
    title: 'Debrief overdue',
    at: 'Yesterday',
    message: 'The debrief for Ruth Okafor is overdue by 2 days — CONSENT_FRAMEWORK §3 requires 48h.',
  },
];

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'text-white bg-white/10 font-medium'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function Sidebar({ activeTo }: { activeTo: string | null }) {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-[#0F1219] border-r border-[#2D3748] z-40">
      <p className="text-xs text-slate-400 uppercase tracking-widest px-4 pt-5 pb-2">{ORG_NAME}</p>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-1 mt-4">
              {section.label}
            </p>
            {section.items.map((item) => (
              <SidebarLink key={item.to} item={item} active={activeTo === item.to} />
            ))}
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-[#2D3748]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {CURRENT_USER.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{CURRENT_USER.name}</p>
            <p className="text-xs text-slate-400 truncate">{CURRENT_USER.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({
  notifications,
  readCount,
  onMarkAllRead,
}: {
  notifications: Notification[];
  readCount: number;
  onMarkAllRead: () => void;
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const unread = Math.max(0, notifications.length - readCount);

  return (
    <header className="fixed top-0 inset-x-0 h-16 z-40 bg-[#0F1219]/95 backdrop-blur border-b border-[#2D3748]">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="PhishYou home">
          <Shield className="w-6 h-6 text-[#2FD9C7]" aria-hidden="true" />
          <span className="text-lg font-black text-white tracking-tight">PhishYou</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Live campaigns indicator — spec: pulsing cyan dot + count */}
          <Link
            to={LIVE_CAMPAIGN_PATH}
            className="hidden sm:flex items-center gap-2 px-2 py-1 group"
            title="Open the live campaign monitor"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FD9C7] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2FD9C7]" />
            </span>
            <span className="text-xs text-[#2FD9C7] group-hover:underline">
              {LIVE_CAMPAIGN_COUNT} campaigns live
            </span>
          </Link>

          {/* Notification bell + popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setBellOpen((v) => !v);
                setMenuOpen(false);
              }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
              aria-expanded={bellOpen}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF4757] text-[10px] font-bold text-white flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setBellOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-80 max-h-96 overflow-y-auto rounded-xl border border-[#2D3748] bg-[#1D232D] shadow-lg z-50"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#252D38]">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button
                      type="button"
                      className="text-xs text-[#2FD9C7] hover:underline"
                      onClick={onMarkAllRead}
                    >
                      Mark all read
                    </button>
                  </div>
                  <ul>
                    {notifications.map((n) => {
                      const meta = NOTIFICATION_META[n.type];
                      return (
                        <li key={n.id} className="flex gap-3 px-4 py-3 border-b border-[#252D38] last:border-b-0">
                          <meta.icon
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: meta.color }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{n.title}</p>
                            <p className="text-xs text-slate-400">{n.at}</p>
                            <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Avatar + org menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setBellOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-white/5 transition-colors"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {CURRENT_USER.initials}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-56 rounded-xl border border-[#2D3748] bg-[#1D232D] shadow-lg z-50 overflow-hidden"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-[#252D38]">
                    <p className="text-sm font-medium text-white">{CURRENT_USER.name}</p>
                    <p className="text-xs text-slate-400">{CURRENT_USER.role}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    Organization Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/users');
                    }}
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    Team &amp; Roles
                  </button>
                  <div className="border-t border-[#252D38]" />
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#FF4757] hover:bg-[#FF4757]/10 transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/login', { replace: true });
                    }}
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom navigation                                            */
/* ------------------------------------------------------------------ */

function MobileNav({ activeTo }: { activeTo: string | null }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 h-16 z-40 bg-[#0F1219]/95 backdrop-blur border-t border-[#2D3748] flex items-stretch"
      aria-label="Primary mobile"
    >
      {MOBILE_TABS.map((tab) => {
        const active = activeTo === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <tab.icon
              className={`w-5 h-5 ${active ? 'text-[#2FD9C7]' : 'text-slate-500'}`}
              aria-hidden="true"
            />
            <span className={`text-[10px] ${active ? 'text-[#2FD9C7] font-medium' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* AppShell                                                            */
/* ------------------------------------------------------------------ */

export default function AppShell() {
  const { pathname } = useLocation();
  const [readCount, setReadCount] = useState(0);

  // Longest matching target wins — keeps /settings/integrations from also
  // highlighting /settings, and /targets/:id from highlighting anything else.
  const activeTo = useMemo(() => {
    const matches = ALL_NAV_ITEMS.map((i) => i.to).filter(
      (to) => pathname === to || pathname.startsWith(`${to}/`),
    );
    return matches.sort((a, b) => b.length - a.length)[0] ?? null;
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar activeTo={activeTo} />
      <Header
        notifications={DEMO_NOTIFICATIONS}
        readCount={readCount}
        onMarkAllRead={() => setReadCount(DEMO_NOTIFICATIONS.length)}
      />
      {/* pt-16 clears the fixed header; pb-20 clears the mobile bottom nav */}
      <main className="md:ml-64 pt-16 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <MobileNav activeTo={activeTo} />
    </div>
  );
}
