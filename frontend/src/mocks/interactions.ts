export type DeliveryStatus = 'Pending' | 'Delivered' | 'Bounced';

export interface TargetInteraction {
  targetId: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt: string | null;
  opened: boolean;
  openedAt: string | null;
  clicked: boolean;
  clickedAt: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

export const INITIAL_INTERACTIONS: TargetInteraction[] = [
  {
    targetId: 'target-alice',
    deliveryStatus: 'Delivered',
    deliveredAt: '2026-09-01T08:17:00+05:00',
    opened: true,
    openedAt: '2026-09-01T08:21:00+05:00',
    clicked: true,
    clickedAt: '2026-09-01T08:23:00+05:00',
    submitted: false,
    submittedAt: null,
  },
  {
    targetId: 'target-bilal',
    deliveryStatus: 'Delivered',
    deliveredAt: '2026-09-01T08:19:00+05:00',
    opened: true,
    openedAt: '2026-09-01T08:28:00+05:00',
    clicked: false,
    clickedAt: null,
    submitted: false,
    submittedAt: null,
  },
  {
    targetId: 'target-sana',
    deliveryStatus: 'Delivered',
    deliveredAt: '2026-09-01T08:20:00+05:00',
    opened: false,
    openedAt: null,
    clicked: false,
    clickedAt: null,
    submitted: false,
    submittedAt: null,
  },
  {
    targetId: 'target-omar',
    deliveryStatus: 'Pending',
    deliveredAt: null,
    opened: false,
    openedAt: null,
    clicked: false,
    clickedAt: null,
    submitted: false,
    submittedAt: null,
  },
];
