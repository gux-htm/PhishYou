/**
 * PhishYou — Mobile bottom navigation
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell (responsive behavior)
 *
 * Fixed bottom h-16 bar, visible below lg. Five primary destinations as icon
 * tabs; active tab is teal. Content is padded via AppShell (pb-16 lg:pb-0).
 */
import { NavLink } from 'react-router-dom';
import { BarChart3, LayoutDashboard, Settings, Target, UserCheck } from 'lucide-react';

interface MobileNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const ITEMS: MobileNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaigns', icon: Target },
  { to: '/targets', label: 'Targets', icon: UserCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Primary navigation (mobile)"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-[#252D38] bg-[#0F1219]/95 backdrop-blur-md lg:hidden"
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-[#2FD9C7]' : 'text-[#7A8595] hover:text-[#A8B4C4]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              <span
                aria-hidden="true"
                className={`h-0.5 w-6 rounded-full transition-colors ${isActive ? 'bg-[#2FD9C7]' : 'bg-transparent'}`}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
