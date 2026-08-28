/**
 * PhishYou — Left sidebar navigation
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell (Left Sidebar elements)
 *
 * Fixed w-64 on desktop (lg+), hidden below. Sections: OVERVIEW, CAMPAIGNS,
 * INTELLIGENCE, ADMINISTRATION. Active item: teal text + subtle bg.
 * "Create Campaign" is rendered as an accent action, per spec.
 */
import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  Plus,
  ScrollText,
  Settings,
  Target,
  UserCheck,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: 'campaignCount';
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { to: '/campaigns', label: 'All Campaigns', icon: Target, badge: 'campaignCount' },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ to: '/learning', label: 'Learning', icon: Activity }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/targets', label: 'Target Management', icon: UserCheck },
      { to: '/audit', label: 'Audit Logs', icon: ScrollText },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const { organization, liveCampaignCount } = useAppContext();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#252D38] bg-[#0F1219] lg:flex"
    >
      {/* Organization */}
      <div className="px-4 pb-2 pt-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[#5A6470]">{organization}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-1 mt-4">
            <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5A6470]">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#2FD9C7]/10 font-medium text-[#2FD9C7]'
                          : 'text-[#A8B4C4] hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge === 'campaignCount' && liveCampaignCount > 0 && (
                      <span className="rounded-full bg-[#2FD9C7]/15 px-2 py-0.5 text-[10px] font-bold text-[#2FD9C7]">
                        {liveCampaignCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Accent action under the Campaigns section */}
            {section.label === 'Campaigns' && (
              <NavLink
                to="/campaigns/new"
                className="mt-2 flex items-center gap-2 rounded-lg bg-[#2FD9C7]/10 px-4 py-2 text-sm font-semibold text-[#2FD9C7] transition-colors hover:bg-[#2FD9C7]/20"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                Create Campaign
              </NavLink>
            )}
          </div>
        ))}
      </div>

      <p className="border-t border-[#252D38] px-4 py-3 text-[10px] text-[#5A6470]">
        Authorized simulation use only
      </p>
    </nav>
  );
}

export default Sidebar;
