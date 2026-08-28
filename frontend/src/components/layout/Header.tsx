/**
 * PhishYou — Top header bar
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell (Top Header Bar elements)
 *
 * Fixed h-16 z-40. Left: shield logo + PhishYou wordmark. Right: live campaigns
 * indicator (pulsing dot), notification bell (popover w/ NotificationsPanel),
 * avatar dropdown (Profile / Organization Settings / Logout).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationsPanel } from '../dashboard/NotificationsPanel';
import { initials } from '../../utils/formatters';

export function Header() {
  const { liveCampaignCount, notifications, unreadCount, markAllNotificationsRead } = useAppContext();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close popovers on outside click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#252D38] bg-[#0F1219] px-4 sm:px-6">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="PhishYou home">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2FD9C7]/25 bg-[#2FD9C7]/10 text-[#2FD9C7]">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-black tracking-[-0.02em] text-[#F5F7FB]">
          Phish<span className="text-[#2FD9C7]">You</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live campaigns indicator */}
        {liveCampaignCount > 0 && (
          <Link
            to="/campaigns"
            className="hidden items-center gap-2 rounded-full border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#8FEFE3] transition-colors hover:bg-[#2FD9C7]/[0.12] sm:flex"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2FD9C7] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2FD9C7]" />
            </span>
            {liveCampaignCount} campaign{liveCampaignCount === 1 ? '' : 's'} live
          </Link>
        )}

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => {
              setBellOpen((open) => !open);
              setMenuOpen(false);
            }}
            className="relative rounded-lg p-2 text-[#A8B4C4] transition-colors hover:bg-white/5 hover:text-white"
            aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
            aria-expanded={bellOpen}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4757] px-1 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)]">
              <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={markAllNotificationsRead}
                onViewAll={() => {
                  setBellOpen(false);
                  navigate('/audit');
                }}
              />
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D3748] text-xs font-bold text-[#F5F7FB]">
              {user ? initials(user.name) : <User className="h-4 w-4" aria-hidden="true" />}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-[#7A8595] sm:block" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[#2D3748] bg-[#1D232D] shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
              <div className="border-b border-[#2D3748] px-4 py-3">
                <p className="truncate text-sm font-semibold text-[#F5F7FB]">{user?.name ?? 'Demo Admin'}</p>
                <p className="truncate text-xs text-[#7A8595]">{user?.email ?? 'security@company.com'}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#A8B4C4] transition-colors hover:bg-white/5 hover:text-white"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/organization');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#A8B4C4] transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Organization Settings
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#FF4757] transition-colors hover:bg-[#FF4757]/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
