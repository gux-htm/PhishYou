/**
 * PhishYou — Notifications panel (header bell popover)
 * Spec: FRONTEND_SPEC_ENHANCED.md — AppShell (notification bell popover)
 *
 * Rendered inside the header's w-80 popover container. Lists notifications with
 * per-type icons, relative timestamps and unread dots; "Mark all read" and
 * "View all alerts" (→ /audit) actions. Mounted by Header, state lives in
 * AppContext.
 */
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, UserCog } from 'lucide-react';
import type { AppNotification, NotificationType } from '../../types';
import { relativeTime } from '../../utils/formatters';

export interface NotificationsPanelProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onViewAll: () => void;
}

const TYPE_META: Record<NotificationType, { icon: typeof Clock; color: string; bg: string }> = {
  HARM_DETECTED: { icon: AlertTriangle, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  CAMPAIGN_COMPLETED: { icon: CheckCircle2, color: '#06D369', bg: 'bg-[#06D369]/10' },
  TARGET_BLOCKED: { icon: ShieldCheck, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  DEBRIEF_OVERDUE: { icon: Clock, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
  ADMIN_ACTION: { icon: UserCog, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
};

export function NotificationsPanel({ notifications, onMarkAllRead, onViewAll }: NotificationsPanelProps) {
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#2D3748] bg-[#1D232D] shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-[#2D3748] px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#F5F7FB]">Notifications</h3>
          {unread > 0 && (
            <span className="rounded-full bg-[#FF4757]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF4757]">
              {unread} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unread === 0}
          className="text-xs font-semibold text-[#2FD9C7] transition-colors hover:text-[#4FE5D3] disabled:text-[#5A6470] disabled:hover:text-[#5A6470]"
        >
          Mark all read
        </button>
      </div>

      <ul className="max-h-96 divide-y divide-[#2D3748] overflow-y-auto">
        {notifications.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[#7A8595]">You're all caught up.</li>
        )}
        {notifications.map((notification) => {
          const meta = TYPE_META[notification.type];
          const Icon = meta.icon;
          return (
            <li key={notification.id} className={`flex gap-3 px-4 py-3 ${notification.read ? 'opacity-60' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#F5F7FB]">{notification.title}</p>
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2FD9C7]" aria-label="Unread" />
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-[#A8B4C4]">{notification.message}</p>
                <time className="mt-1 block text-[10px] text-[#5A6470]">{relativeTime(notification.timestamp)}</time>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onViewAll}
        className="w-full border-t border-[#2D3748] bg-[#232D39]/50 px-4 py-2.5 text-xs font-semibold text-[#A8B4C4] transition-colors hover:bg-[#232D39] hover:text-white"
      >
        View all alerts →
      </button>
    </div>
  );
}

export default NotificationsPanel;
