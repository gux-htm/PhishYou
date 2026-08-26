# Frontend Implementation Checklist

## For AI Coding Agents & Development Teams

This checklist ensures every page, component, and micro-interaction follows the new design system. Use this as a verification tool during implementation.

---

## Phase 1: Foundation Setup (Before Building Pages)

### Tailwind Configuration
- [ ] Add extended color palette to `tailwind.config.js`
  - [ ] Background colors (base, surface, elevated, subtle, accent)
  - [ ] Text colors (primary, secondary, tertiary, muted, inverse)
  - [ ] Accent colors (primary, success, warning, danger, info, neutral, insight)
  - [ ] Border colors (subtle, default, light, active, error)
  - [ ] Data viz colors (series-1 through series-5)
- [ ] Add shadow system (xs, sm, md, lg, xl, glow-teal, glow-danger)
- [ ] Add animation keyframes (slideInRight, fadeInUp, pulseGlow, pulseGlowDanger, shimmer, bounceGentle, scalePulse)
- [ ] Add custom animations (pulse-glow, pulse-glow-danger, shimmer, bounce-gentle, scale-pulse, slide-in-right, slide-out-right, fade-in-up)
- [ ] Add fontSize custom scale (display: 36px, section: 24px)
- [ ] Add reduced-motion plugin support

### Global CSS
- [ ] Create CSS utility file with:
  - [ ] Root CSS variables (overlays: --overlay-hover, --overlay-focus, --overlay-selected, etc.)
  - [ ] Glass-morphism card class
  - [ ] Gradient text utility (gradient-text-primary)
  - [ ] Ring utilities
  - [ ] `prefers-reduced-motion` media query with all animations disabled

### shadcn/ui Components
- [ ] Install all required shadcn/ui components:
  - [ ] Button, Input, Select, Textarea, Checkbox, Switch
  - [ ] Dialog, AlertDialog, Popover, Sheet
  - [ ] Table, Badge, Tooltip
  - [ ] Tabs, Accordion
  - [ ] Toast/Toaster

### React Router Setup
- [ ] Configure BrowserRouter
- [ ] Define all 17 routes
- [ ] Create ProtectedRoute wrapper component
- [ ] Test routing on all pages

---

## Phase 2: Shared Components (Used Across All Pages)

### AppShell Component
- [ ] Header bar (h-16, fixed, z-40)
  - [ ] Logo + shield icon (text-lg font-black, shield in accent-primary)
  - [ ] Live campaigns indicator (pulsing dot + "X campaigns live")
  - [ ] Notification bell with badge count
  - [ ] User avatar dropdown (initials in w-8 h-8 circle)
- [ ] Left sidebar (w-64, fixed, hidden on mobile)
  - [ ] Organization name (text-xs text-slate-400 uppercase tracking-widest)
  - [ ] Navigation sections with labels
  - [ ] All 8 nav items with correct icons (lucide-react)
  - [ ] Campaign count badge
  - [ ] Mobile collapsed state (icon-only, 64px width)
- [ ] Mobile bottom navigation (h-16, visible < 768px)
  - [ ] 5 main nav items as icons
  - [ ] Active indicator on current page

### Global Components
- [ ] Toast notifications (success, error, warning, info variants)
  - [ ] Correct background (#1C2333 with border)
  - [ ] Correct icons (CheckCircle2, XCircle, AlertTriangle, Info)
  - [ ] Auto-dismiss 5 seconds (errors persist)
  - [ ] Slide-in-right animation (300ms ease-out)
  - [ ] Left border accent (4px)

- [ ] Loading states
  - [ ] Page-level: centered spinner (Loader2, text-accent-primary, animate-spin, w-8 h-8)
  - [ ] Table loading: 5 skeleton rows (animate-pulse bg-slate-700 rounded)
  - [ ] Card loading: pulsing placeholder shapes
  - [ ] Button loading: spinner overlay, button disabled, width maintained
  - [ ] Shimmer animation (gradient wave, 2s linear)

- [ ] Empty states
  - [ ] Centered layout
  - [ ] Icon (w-12 h-12 text-slate-600)
  - [ ] Heading (text-lg font-semibold text-slate-400)
  - [ ] Description (text-sm text-slate-500)
  - [ ] CTA button if appropriate

- [ ] Error states
  - [ ] Red background (bg-red-500/10)
  - [ ] Red border (border border-red-500/30)
  - [ ] XCircle icon (red)
  - [ ] Heading + error message
  - [ ] "Try again" button
  - [ ] "Contact support" ghost link

- [ ] Confirmation dialogs (AlertDialog)
  - [ ] Title describes action
  - [ ] Description explains consequences
  - [ ] Cancel button (default focus)
  - [ ] Confirm button (destructive variant, red)

- [ ] Keyboard shortcuts
  - [ ] Cmd/Ctrl + K — command palette
  - [ ] Cmd/Ctrl + N — new campaign
  - [ ] Escape — close modals

### Resistance Score Gauge Component
- [ ] SVG-based circular arc indicator
- [ ] Three-stage color progression (green → amber → red)
- [ ] Dynamic glow effects (--shadow-glow-teal or --shadow-glow-danger)
- [ ] Pulse animations (static, gentle, urgent based on value)
- [ ] Size variants (w-12, w-16, w-20)
- [ ] Smooth stroke-dasharray animation on value change (1000ms ease-in-out)

### Button Styling (Override shadcn/ui Defaults)
- [ ] Primary button
  - [ ] Background: accent-primary (#2FD9C7)
  - [ ] Hover: gradient to accent-primary-light, scale 1.02, glow shadow
  - [ ] Active: scale 0.98, opacity 0.85
  - [ ] Text: white, weight 600, uppercase tracking
  - [ ] Rounded: rounded-lg (8px)

- [ ] Secondary button
  - [ ] Background: border color (#2D3748)
  - [ ] Border: 1px solid border-light
  - [ ] Hover: background shifts to bg-subtle
  - [ ] Same hover/active behavior as primary

- [ ] Destructive button
  - [ ] Background: accent-danger (#FF4757)
  - [ ] Glow shadow: --shadow-glow-danger on hover
  - [ ] Same transitions as primary

- [ ] Ghost button
  - [ ] No background by default
  - [ ] Hover: background overlay-hover, text shifts to accent-primary
  - [ ] Used for tertiary actions

### Form Input Styling (Override shadcn/ui Defaults)
- [ ] Default border: border-color (#2D3748)
- [ ] Focus border: border-accent-primary (#2FD9C7)
- [ ] Focus ring: ring-2 ring-accent-primary
- [ ] Background: bg-elevated
- [ ] Padding: px-3 py-2.5 (larger for UX)
- [ ] Rounded: rounded-lg (8px)
- [ ] Transition: 200ms ease-out
- [ ] Disabled: bg-bg-subtle, opacity 0.5, cursor-not-allowed
- [ ] Placeholder: text-muted (no opacity reduction)

### Card Styling (Standard Pattern)
- [ ] Background: bg-surface
- [ ] Border: 1px solid border
- [ ] Rounded: rounded-xl (12px)
- [ ] Padding: p-6
- [ ] Shadow: shadow-sm
- [ ] Hover: scale 1.01, shadow-md, background brightens (add overlay-hover)
- [ ] Transition: 200ms ease-out all

### Status Badge Styling
- [ ] ACTIVE: bg-accent-primary/10 text-accent-primary (+ pulse animation if live)
- [ ] PAUSED: bg-warning/10 text-warning
- [ ] COMPLETED: bg-success/10 text-success
- [ ] HALTED: bg-danger/10 text-danger
- [ ] COMPROMISED: bg-danger/15 text-danger font-semibold
- [ ] DEFENDED: bg-success/10 text-success
- [ ] BLOCKED: bg-neutral/10 text-neutral
- [ ] PENDING: bg-neutral/10 text-text-tertiary

---

## Phase 3: Page-Specific Implementation

### Page 1: Login (`/login`)
- [ ] Background: full-screen bg-base
- [ ] Card centered: bg-surface, border, rounded-xl, shadow-md
- [ ] Title: text-3xl font-black tracking-tight
- [ ] Email input: border-accent-primary on focus
- [ ] Password input: same styling
- [ ] "Login" button: primary variant, full width
- [ ] "Forgot password?" link: text-sm text-accent-primary hover:text-accent-primary-dark
- [ ] Remember me checkbox: accent-primary checked color
- [ ] Error handling: red border on invalid input + error toast

### Page 2: Dashboard (`/dashboard`)
- [ ] Hero section: max-w-7xl mx-auto px-6 py-8
  - [ ] Title: "Dashboard" (text-3xl font-black)
  - [ ] Subtitle: "Welcome back, [User]"
  - [ ] Date/time: text-sm text-secondary
  
- [ ] Grid layout (responsive):
  - [ ] Desktop: 3 columns, gap-6
  - [ ] Tablet: 2 columns, gap-5
  - [ ] Mobile: 1 column, gap-4
  
- [ ] Metric cards:
  - [ ] Title: text-base font-medium
  - [ ] Value: text-2xl font-bold text-accent-primary
  - [ ] Trend: text-xs with up/down icon + percentage
  - [ ] Hover: scale 1.01, shadow-md
  
- [ ] Campaign cards:
  - [ ] Tier badge (Tier A: red, Tier B: amber, Tier C: green)
  - [ ] Resistance gauge (w-16 SVG)
  - [ ] Campaign name: text-lg font-semibold
  - [ ] Status badge: ACTIVE, PAUSED, COMPLETED, etc.
  - [ ] Click to navigate: /campaigns/:id
  
- [ ] Charts section:
  - [ ] Use recharts with data-series colors (blue, green, amber, red, teal)
  - [ ] Axes labels: text-xs text-secondary
  - [ ] Legend: text-sm text-secondary
  
- [ ] Notifications panel:
  - [ ] Recent alerts list
  - [ ] Timestamp: text-xs text-tertiary
  - [ ] Alert type badge
  - [ ] Click to relevant page

### Page 3: Campaign List (`/campaigns`)
- [ ] Page title: "Campaigns" (text-3xl font-black)
- [ ] Filter controls:
  - [ ] Status dropdown (All, Active, Paused, Completed, Halted)
  - [ ] Tier filter (A, B, C, All)
  - [ ] Search input: accent-primary on focus
  - [ ] Layout: flex gap-4, wrap on mobile
  
- [ ] Table or card list:
  - [ ] Campaign name: text-base font-semibold
  - [ ] Status badge: with correct colors
  - [ ] Tier badge: Tier A (red), B (amber), C (green)
  - [ ] Resistance gauge: inline w-12
  - [ ] Created date: text-xs text-tertiary
  - [ ] Target count: text-sm text-secondary
  - [ ] Row hover: bg-subtle + overlay-hover
  - [ ] Row height: h-12 (48px)
  
- [ ] Empty state if no campaigns
- [ ] Create Campaign button: primary, top right, text-base font-semibold

### Page 4: Create Campaign Wizard (`/campaigns/new`)
- [ ] Multi-step form (5 steps, progress indicator at top)
  - [ ] Step 1: Campaign Details
  - [ ] Step 2: Target Selection
  - [ ] Step 3: Persona & Channel
  - [ ] Step 4: Content & Schedule
  - [ ] Step 5: Review & Launch
  
- [ ] Progress bar:
  - [ ] Background: bg-subtle
  - [ ] Fill: bg-gradient-primary-cta (teal → green)
  - [ ] Animated: smooth fill transition on next step
  - [ ] Step indicators: circles with numbers
  
- [ ] Form sections:
  - [ ] Labels: text-sm font-semibold text-secondary
  - [ ] Input fields: border-accent-primary on focus
  - [ ] Checkboxes/switches: accent-primary color
  - [ ] Help text: text-xs text-tertiary below inputs
  
- [ ] Step navigation:
  - [ ] "Back" button: secondary variant (disabled on step 1)
  - [ ] "Next" / "Launch" button: primary variant
  - [ ] Both buttons: smooth fade transitions (200ms)
  
- [ ] Preview section (step 5):
  - [ ] Tier selection: A/B/C with red/amber/green backgrounds
  - [ ] Resistance score gauge: w-20 (hero size)
  - [ ] Campaign summary: key details in list format
  - [ ] Launch button: primary variant with gradient, scale on hover

### Page 5: Campaign Detail (`/campaigns/:id`)
- [ ] Header section:
  - [ ] Campaign name: text-3xl font-black
  - [ ] Status badge: with correct colors
  - [ ] Tier badge: A/B/C
  - [ ] Created/Started date: text-sm text-secondary
  
- [ ] Tabs (tab indicator animates, 250ms ease-out):
  - [ ] Overview tab (default)
  - [ ] Timeline tab
  - [ ] Targets tab
  - [ ] Analytics tab
  - [ ] Settings tab
  
- [ ] Overview tab content:
  - [ ] Campaign summary card: bg-surface, rounded-xl, p-6
  - [ ] Resistance gauge: w-20 centered
  - [ ] Metrics grid: 4 columns desktop, responsive
  - [ ] Key dates section: created, started, expected end
  
- [ ] Timeline tab:
  - [ ] Vertical timeline visual
  - [ ] Events colored by type (green success, red error, amber warning)
  - [ ] Timestamps: text-xs text-tertiary
  - [ ] Event descriptions: text-sm text-secondary
  
- [ ] Targets tab:
  - [ ] Table or list of targets
  - [ ] Target name, email (masked), status, outcome
  - [ ] Row hover: overlay-hover background
  - [ ] Click target to view details
  
- [ ] Analytics tab:
  - [ ] Charts with data-series colors
  - [ ] Gauges showing key metrics
  - [ ] Data table for detailed breakdown
  
- [ ] Settings tab:
  - [ ] Campaign settings (read-only or editable based on status)
  - [ ] Pause/Resume button: secondary variant
  - [ ] Halt button: destructive variant
  - [ ] Delete button: ghost variant in red
  
- [ ] Action buttons (top right):
  - [ ] Export AAR: secondary variant
  - [ ] Go Live: primary variant (if status = CREATED)
  - [ ] More menu: ghost icon button with dropdown

### Page 6: Live Campaign Monitor (`/campaigns/:id/live`)
- [ ] Real-time indicators:
  - [ ] Pulsing dot + "Campaign LIVE" (text-accent-primary)
  - [ ] Elapsed time: updated every second
  - [ ] Last update: "Updated 2 seconds ago" (text-xs text-tertiary)
  
- [ ] Hero gauge section:
  - [ ] Resistance score gauge: w-20 with intense pulse
  - [ ] Current resistance: text-3xl font-bold
  - [ ] Gauge glow: --shadow-glow-teal or --shadow-glow-danger (based on resistance)
  
- [ ] Live events stream:
  - [ ] Card-based event list, newest first
  - [ ] Event icon: colored by type (green, red, amber, blue)
  - [ ] Event description: text-sm text-secondary
  - [ ] Timestamp: text-xs text-tertiary
  - [ ] Scroll with loading indicator at bottom
  
- [ ] Side panel (or bottom section on mobile):
  - [ ] Current status badge
  - [ ] Target engagement count: "42 targets engaged"
  - [ ] Compromised count: "8 compromised"
  - [ ] Defended count: "34 defended"
  - [ ] Pause button: secondary variant
  - [ ] Halt button: destructive variant
  
- [ ] Audio/video playback (if applicable):
  - [ ] Player controls: play, pause, volume
  - [ ] Transcript below: text-sm, mono font for technical content
  
- [ ] Auto-refresh: polling every 3 seconds with toast on update
- [ ] Smooth animations: new events fade-in-up (300ms)

### Page 7: After-Action Report (`/campaigns/:id/aar`)
- [ ] Header:
  - [ ] Report title: "After-Action Report: [Campaign Name]"
  - [ ] Generated date: text-xs text-tertiary
  - [ ] Tier badge: A/B/C
  - [ ] Export PDF button: secondary variant (uses browser print)
  
- [ ] Summary section:
  - [ ] Hero gauge: Resistance Score (w-20)
  - [ ] Key metrics: 4 cards with values (targets, engaged, compromised, defended)
  - [ ] Timeline: campaign duration in human-readable format
  
- [ ] Tabs (same as campaign detail):
  - [ ] Overview (default)
  - [ ] Targets
  - [ ] Behavior
  - [ ] Intelligence
  - [ ] Recommendations
  - [ ] Export
  
- [ ] Overview tab:
  - [ ] Campaign summary: text-sm text-secondary in prose
  - [ ] Tier effectiveness: text-base font-semibold
  - [ ] Gauge with gradient glow
  
- [ ] Targets tab:
  - [ ] Table: name, email, outcome (compromised/defended), engagement_time
  - [ ] Outcomes colored: red (compromised), green (defended)
  - [ ] Row height: h-12
  
- [ ] Behavior tab:
  - [ ] Heatmap or timeline showing engagement patterns
  - [ ] Charts with recharts (data-series colors)
  - [ ] Time-of-day analysis
  
- [ ] Intelligence tab:
  - [ ] Threat patterns identified
  - [ ] Policy gaps discovered: list format
  - [ ] Recommendations: text-sm, possible callout boxes
  
- [ ] Recommendations tab:
  - [ ] Next campaign suggestions: text-base font-semibold
  - [ ] Tier recommendations: A (continue aggressive), B (balanced), C (defensive)
  - [ ] Training recommendations: bulleted list, text-sm
  
- [ ] Export tab:
  - [ ] PDF export button: primary variant (triggers browser print dialog)
  - [ ] CSV export button: secondary variant
  - [ ] JSON export button: secondary variant
  - [ ] Export options: checkboxes for what to include

### Pages 8–17
- [ ] All pages follow same patterns:
  - [ ] Page title: text-3xl font-black
  - [ ] Consistent sidebar navigation (active state: accent-primary)
  - [ ] Cards: rounded-xl, shadow-sm, hover:shadow-md
  - [ ] Tables: row height 48px, hover overlay-hover
  - [ ] Forms: border-accent-primary on focus, text-secondary labels
  - [ ] Buttons: primary/secondary/destructive/ghost variants
  - [ ] Status badges: consistent color system
  - [ ] Empty states: centered icon, heading, description, CTA
  - [ ] Loading states: shimmer bars, pulse animation
  - [ ] Toasts on success/error actions

---

## Phase 4: Animations & Interactions

### Button Animations
- [ ] Hover: scale 1.02 (200ms ease-out)
- [ ] Click: scale 0.98 (150ms ease-out)
- [ ] Color shift on hover: to primary-dark
- [ ] Loading state: spinner overlay, button disabled
- [ ] Disabled: opacity 0.5, cursor-not-allowed, no hover effect

### Link Animations
- [ ] Hover: underline appears + color to primary-dark
- [ ] Transition: 200ms ease-out
- [ ] Focus: visible ring (3px ring-accent-primary)
- [ ] Active state: slight opacity increase

### Modal Animations
- [ ] Open: fade + slide-in from top (300ms cubic-bezier(0.16, 1, 0.3, 1))
- [ ] Close: fade + slide-out down (same duration)
- [ ] Backdrop: fades in, --overlay-muted (40% black)
- [ ] Focus: first focusable element gets focus (keyboard trap)

### Toast Animations
- [ ] Enter: slide-in from right + fade (300ms ease-out)
- [ ] Exit: slide-out right + fade (300ms ease-out)
- [ ] Success: left border green, CheckCircle2 icon
- [ ] Error: left border red, XCircle icon, persist until dismissed
- [ ] Warning: left border amber, AlertTriangle icon
- [ ] Info: left border blue, Info icon

### Tab Animations
- [ ] Indicator bar: slides to new tab (250ms ease-out)
- [ ] Content: fade in/out (200ms ease-out)
- [ ] Active tab: accent-primary text color
- [ ] Inactive tab: text-secondary

### Dropdown Animations
- [ ] Open: fade + scale-up from anchor (150ms ease-out)
- [ ] Close: fade + scale-down (150ms ease-out)
- [ ] Items on hover: background overlay-hover

### Gauge Arc Animations
- [ ] Value change: smooth arc fill (1000ms ease-in-out)
- [ ] Pulse on high resistance: 1.2s ease-in-out with glow
- [ ] Gentle pulse on medium: 2s ease-in-out
- [ ] Static on low resistance

### Loading State Animations
- [ ] Shimmer: wave left-to-right (2s linear infinite)
- [ ] Spinner: rotation 1s linear infinite
- [ ] Pulse: opacity fade (--shadow-sm glow pulse)
- [ ] Combined: skeletal elements show shimmer wave + subtle pulse

---

## Phase 5: Accessibility & Testing

### Keyboard Navigation
- [ ] Tab order: logical, top-to-bottom
- [ ] Focus visible: all interactive elements have clear focus ring
- [ ] Escape key: closes modals/dropdowns
- [ ] Enter key: activates buttons/links
- [ ] Shortcuts work: Cmd/Ctrl + K, Cmd/Ctrl + N, Escape

### Color Contrast
- [ ] All text: 4.5:1 contrast ratio minimum
- [ ] Large text (18px+): 3:1 contrast minimum
- [ ] Test with WebAIM contrast checker
- [ ] Never rely on color alone (always pair with text/icon)

### Reduced Motion
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] CSS media query applied globally
- [ ] Test with OS reduced motion setting enabled
- [ ] Functionality remains identical, just no motion

### Screen Reader Testing
- [ ] All icons have aria-labels or are decorative (aria-hidden="true")
- [ ] Form labels associated: `<label htmlFor="input-id">`
- [ ] Tables have proper `<thead>`, `<tbody>`, `<th>` elements
- [ ] Headings: proper hierarchy (h1, h2, h3, not skipped)
- [ ] ARIA landmarks: `<main>`, `<nav>`, `<aside>`

### Mobile Responsiveness
- [ ] Sidebar hidden < 768px, bottom nav shown
- [ ] Touch targets: minimum 44x44px
- [ ] Breakpoints: mobile (< 768px), tablet (768–1024px), desktop (> 1024px)
- [ ] Horizontal scroll: never happens
- [ ] Grid columns: 1 (mobile), 2 (tablet), 3 (desktop)

### Browser Compatibility
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] CSS Variables support (all modern browsers)
- [ ] Tailwind CSS support (IE11 not required)
- [ ] React 18+ (hooks, suspense)

---

## Phase 6: Performance Optimization

- [ ] Code-split pages (lazy load routes)
- [ ] Optimize images (no images > 500KB)
- [ ] Memoize expensive components (React.memo for cards, gauges)
- [ ] Debounce search/filter inputs (300ms)
- [ ] Throttle scroll events (1000ms for infinite scroll)
- [ ] Cancel in-flight requests on component unmount
- [ ] No memory leaks: clean up subscriptions in useEffect
- [ ] Bundle size: < 500KB gzipped (excluding node_modules)

---

## Verification Checklist (Before Handoff)

- [ ] All routes exist and navigate correctly
- [ ] All pages render without console errors
- [ ] All buttons and links are clickable
- [ ] All forms validate and submit
- [ ] All animations perform smoothly (60fps)
- [ ] All colors match spec (use hex picker)
- [ ] All typography follows scale (measure font sizes)
- [ ] All cards have shadows and hover effects
- [ ] All status badges display correctly
- [ ] Resistance gauges render and animate
- [ ] Toasts appear and dismiss correctly
- [ ] Loading states show when fetching
- [ ] Empty states display with proper messaging
- [ ] Error handling works (network failures)
- [ ] Mobile layout reflows correctly
- [ ] Keyboard navigation works across all pages
- [ ] Focus rings visible on all interactive elements
- [ ] Reduced motion respected
- [ ] Color contrast meets WCAG AA
- [ ] No console errors or warnings
- [ ] Performance is smooth (no jank)

---

*Checklist Version: 1.0*
*For: PhishYou Frontend Implementation*
*Date: August 26, 2026*
