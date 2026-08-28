/**
 * PhishYou — Live event stream
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 4: Campaign Detail (recent activity
 *       feed) + PAGE 5/6 live event patterns
 *
 * Compact reverse-chronological feed of audit events with per-type icons and
 * relative timestamps. Used on the Campaign Detail page's side rail; sized to
 * scroll independently inside a fixed-height container.
 */
import { AlertTriangle, BookOpen, CheckCircle2, FileDown, Lock, Pause, Play, ScrollText, ShieldCheck, ShieldX, StopCircle, UserCog } from 'lucide-react';
import type { AuditEvent, AuditEventType } from '../../types';
import { relativeTime } from '../../utils/formatters';

export interface LiveEventStreamProps {
  events: AuditEvent[];
  /** Visible rows before internal scroll — default 8. */
  maxVisible?: number;
  /** Live indicator (pulsing dot) when events are still arriving. */
  live?: boolean;
}

const EVENT_META: Record<AuditEventType, { icon: typeof ScrollText; color: string; bg: string }> = {
  CAMPAIGN_CREATED: { icon: ScrollText, color: '#A8B4C4', bg: 'bg-[#8B95A8]/10' },
  CAMPAIGN_STARTED: { icon: Play, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  CAMPAIGN_PAUSED: { icon: Pause, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  CAMPAIGN_RESUMED: { icon: Play, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  CAMPAIGN_HALTED: { icon: StopCircle, color: '#FF4757', bg: 'bg-[#FF4757]/10' },
  CAMPAIGN_COMPLETED: { icon: CheckCircle2, color: '#06D369', bg: 'bg-[#06D369]/10' },
  TARGET_COMPROMISED: { icon: ShieldX, color: '#FF4757', bg: 'bg-[#FF4757]/12' },
  TARGET_DEFENDED: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10' },
  TARGET_BLOCKED: { icon: Lock, color: '#8B95A8', bg: 'bg-[#8B95A8]/10' },
  HARM_DETECTED: { icon: AlertTriangle, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  CONSENT_RECORDED: { icon: FileDown, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
  DEBRIEF_DELIVERED: { icon: BookOpen, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
  ADMIN_ACTION: { icon: UserCog, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
  DATA_EXPORTED: { icon: FileDown, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
  INTEGRITY_VERIFIED: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10' },
};

export function LiveEventStream({ events, maxVisible = 8, live = false }: LiveEventStreamProps) {
  return (
    <div className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#F5F7FB]">Recent activity</h3>
        {live && <span className="py-pulse-live h-2 w-2 rounded-full bg-[#2FD9C7]" aria-label="Live" />}
      </div>
      <p className="mt-1 text-xs text-[#7A8595]">Immutable audit trail — newest first</p>

      <ul className="mt-4 max-h-[26rem] divide-y divide-[#2D3748] overflow-y-auto" style={{ maxHeight: maxVisible * 64 }}>
        {events.length === 0 && (
          <li className="py-6 text-center text-sm text-[#7A8595]">No events recorded yet.</li>
        )}
        {events.map((event) => {
          const meta = EVENT_META[event.eventType];
          const Icon = meta.icon;
          return (
            <li key={event.id} className="flex items-start gap-3 py-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F5F7FB]">{event.summary}</p>
                <p className="mt-0.5 truncate text-xs text-[#7A8595]">
                  {event.actor}
                  {event.targetName ? ` · ${event.targetName}` : ''}
                </p>
              </div>
              <time className="shrink-0 text-[10px] text-[#5A6470]">{relativeTime(event.timestamp)}</time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default LiveEventStream;
