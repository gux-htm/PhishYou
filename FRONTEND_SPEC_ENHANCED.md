# PhishYou — Frontend Specification Document
**Enterprise AI-Driven Social Engineering Simulation Platform**

---

## Document Purpose

This specification defines every page, component, state, and UI element of the PhishYou frontend. It is written so that any developer — or any AI coding agent — can take a subset of pages, read only this file, and produce production-quality frontend code with zero ambiguity. Each section describes layout, component inventory, data inputs, interactions, error states, and responsive behavior. Nothing is left to interpretation.

---

## Tech Stack (Locked)

| Layer | Technology |
|---|---|
| Framework | React (functional components with hooks) |
| Styling | Tailwind CSS (utility-first; Tailwind core classes only — no compiler) |
| Component Library | shadcn/ui (imported from `@/components/ui/...`) |
| Icons | lucide-react@0.383.0 |
| Charts & Analytics | recharts |
| State Management | React useState / useReducer (local) + context where shared |
| HTTP Client | fetch (native browser API wrapped in async functions) |
| Routing | React Router v6 (BrowserRouter, Routes, Route, Link, useNavigate, useParams) |
| Animations | Tailwind transitions + CSS keyframes (minimal, purposeful) |
| Date/Time | Native JS Date + Intl API |
| PDF Export | Browser print dialog triggered via JS (AAR export) |

---

## Design System

### Color Palette — "Slate & Teal Contemporary"

**Philosophy:** Move away from the "generic AI dark command center" aesthetic. Instead, craft a **premium, intentional design** that feels like a mature, trusted enterprise platform. Think of the design language of modern fintech (Stripe, Wise), SaaS leaders (Linear, Vercel), or contemporary design agencies—sophisticated, warm, refined.

**Foundation Colors:**
```
/* BACKGROUND PALETTE — Warm Slate Foundation (not cold blue-navy) */
--color-bg-base:        #0F1219   /* off-black, ultra-slightly warm — primary background */
--color-bg-surface:     #15191F   /* card/panel background — subtle depth, readable */
--color-bg-elevated:    #1D232D   /* modals, dropdowns, premium surfaces — refined elevation */
--color-bg-subtle:      #232D39   /* table row hover, disabled states — soft hierarchy */
--color-bg-accent:      #1A1F28   /* alternative surface for contrast variety */

/* BORDER & DIVIDER PALETTE */
--color-border-subtle:  #252D38   /* very subtle dividers, outer borders */
--color-border:         #2D3748   /* standard borders, form inputs, dividers */
--color-border-light:   #3D4860   /* lighter borders for softer visual hierarchy */
--color-border-active:  #2FD9C7   /* focused inputs, selected states — emerald teal */
--color-border-error:   #FF4757   /* error input borders — warm red */

/* TEXT PALETTE — Warm, Readable, Hierarchical */
--color-text-primary:   #F5F7FB   /* headings, primary content — warm off-white */
--color-text-secondary: #A8B4C4   /* labels, captions, metadata — warm slate gray */
--color-text-tertiary:  #7A8595   /* tertiary info, hints — muted slate */
--color-text-muted:     #5A6470   /* placeholders, disabled — deep muted slate */
--color-text-inverse:   #0F1219   /* text on light/bright backgrounds */

/* PRIMARY ACCENT — Emerald-Teal (contemporary, sophisticated) */
--color-accent-primary:       #2FD9C7   /* primary buttons, links, active states — emerald teal */
--color-accent-primary-dark:  #1FA89D   /* hover/pressed state, stronger emphasis */
--color-accent-primary-light: #4FE5D3   /* subtle backgrounds, ghost buttons, disabled accents */

/* STATUS ACCENTS — Energetic, Refined */
--color-accent-success:  #06D369   /* success, defended — fresh, hopeful green */
--color-accent-warning:  #F59E0B   /* warnings, Tier B, paused — warm amber */
--color-accent-danger:   #FF4757   /* danger, compromised, Tier A — warm red (coral-leaning) */
--color-accent-info:     #5B9EFF   /* informational hints — refined sky blue */
--color-accent-neutral:  #8B95A8   /* neutral states, blocked — refined slate */

/* SECONDARY PALETTE — Analytics & Data Visualization */
--color-insight-primary:   #A78BFA   /* analytics, psychological scoring — refined purple */
--color-insight-secondary: #D8B4FE   /* lighter variant for overlays */
--color-data-series-1:    #60A5FA   /* chart series 1 — cool blue */
--color-data-series-2:    #34D399   /* chart series 2 — emerald green */
--color-data-series-3:    #FBBF24   /* chart series 3 — golden amber */
--color-data-series-4:    #F87171   /* chart series 4 — coral red */
--color-data-series-5:    #2FD9C7   /* chart series 5 — primary teal */

/* TIER COLORS — Semantic, Clear Intent */
--color-tier-a:         #FF4757   /* Tier A — Aggressive, high-risk emphasis */
--color-tier-b:         #F59E0B   /* Tier B — Balanced, measured approach */
--color-tier-c:         #06D369   /* Tier C — Cautious, defensive success */

/* GRADIENT ACCENTS — Used Sparingly for Premium Elements */
--gradient-primary-cta:   linear-gradient(135deg, #2FD9C7 0%, #06D369 100%)   /* emerald → green for hero CTAs */
--gradient-danger-emphasis: linear-gradient(135deg, #FF4757 0%, #FB3E5C 100%) /* warm red for Tier A cards */
--gradient-premium-glow:  radial-gradient(circle at center, rgba(47, 217, 199, 0.12) 0%, transparent 70%) /* subtle teal glow */
--gradient-shimmer:       linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%) /* loading shimmer */

/* OVERLAY & TRANSPARENCY UTILITIES */
--overlay-hover:      rgba(47, 217, 199, 0.08)   /* teal subtle hover overlay */
--overlay-focus:      rgba(47, 217, 199, 0.12)   /* teal focus overlay */
--overlay-selected:   rgba(47, 217, 199, 0.15)   /* teal selection overlay */
--overlay-success:    rgba(6, 211, 105, 0.1)     /* success state overlay */
--overlay-danger:     rgba(255, 71, 87, 0.1)     /* danger state overlay */
--overlay-muted:      rgba(0, 0, 0, 0.4)         /* for modals and backdrops */

/* SHADOW ELEVATION SYSTEM */
--shadow-xs:      0 1px 2px 0 rgba(0, 0, 0, 0.25)
--shadow-sm:      0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)
--shadow-md:      0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)
--shadow-lg:      0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.2)
--shadow-xl:      0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.2)
--shadow-glow-teal: 0 0 20px rgba(47, 217, 199, 0.2)  /* teal glow for premium elements */
--shadow-glow-danger: 0 0 20px rgba(255, 71, 87, 0.2) /* danger glow for Tier A emphasis */
```

**Palette Rationale & Modern Design Principles:**

1. **Warm Slate Base**: Off-black (#0F1219) with the slightest warm undertone feels more human and less "tech startup command center" than cold pure-black or blue-navy.

2. **Emerald-Teal Primary (#2FD9C7)**: A contemporary alternative to generic cyan. This accent feels sophisticated, natural (think ocean, wellness), and distinct from both the typical SaaS blue and the clichéd AI purple-gradient. It's fresh, energetic, yet refined.

3. **Status Colors Warm-Shifted**: The danger red is #FF4757 (warm coral) instead of #EF4444 (cold pure red). The green is #06D369 (fresh, hopeful) instead of muted. The amber remains for balance. Together, these feel like a curated palette, not defaults.

4. **Refined Neutral System**: Multiple levels of text and border colors (primary, secondary, tertiary, muted) create sophisticated visual hierarchy without jarring jumps.

5. **Gradient Reserve**: Gradients are only used on premium CTAs, Tier A emphasis, and glows—never as wallpaper or default styling. Restraint = sophistication.

6. **Overlay System**: Instead of harsh color changes on hover, use transparent overlays (10-15% opacity of primary accent). This creates micro-interactions that feel polished and intentional.

7. **Shadow Elevation**: Layered shadows (not flat design) provide depth and visual hierarchy. Glowing shadows on premium elements (teal for success, warm red for danger) add luxury.

### Typography — Contemporary & Intentional

**Font Selections** (Google Fonts or system fonts):
```
Display font:   "Sohne" or "Geist" or "Inter" (weight 700–900, letter-spacing -0.02em)
                → All page titles, major campaign names, hero text
                → These fonts have a modern, premium feel; use tight tracking.

Body font:      "Inter" (weight 400–500, letter-spacing 0)
                → All body text, descriptions, labels
                → At sizes below 14px, use weight 500 for better clarity

Mono font:      "JetBrains Mono", "Fira Code", or system `monospace`
                → Code, hashes, IDs, audit logs, message content
                → Always weight 500 for better readability on dark backgrounds
```

**Type Scale & Styles** (using Tailwind + custom CSS where needed):

| Use Case | Tailwind Base | Font Weight | Letter-Spacing | Color | Notes |
|---|---|---|---|---|---|
| **Page Title** | `text-4xl` (36px) | 800 (black) | -0.02em | --color-text-primary | Bold, commanding, tight tracking |
| **Section Heading** | `text-2xl` (24px) | 700 (bold) | -0.01em | --color-text-primary | Clear visual hierarchy |
| **Card Title / Panel Header** | `text-lg` (18px) | 700 (bold) | 0 | --color-text-primary | Strong but approachable |
| **Subheading / Label** | `text-base` (16px) | 600 (semibold) | 0 | --color-text-secondary | Slightly de-emphasized |
| **Body Text / Description** | `text-sm` (14px) | 400 (normal) | 0.02em | --color-text-secondary | Optimal readability at 14px |
| **Caption / Metadata** | `text-xs` (12px) | 500 (medium) | 0.01em | --color-text-tertiary | For timestamps, IDs, small info |
| **Technical / Code** | `text-xs` (12px) | 500 (medium) | 0.02em | --color-text-muted + mono font | Hash, API key, audit log |
| **Placeholder / Disabled** | `text-sm` (14px) | 400 (normal) | 0.02em | --color-text-muted | Low contrast intentional |

**Line Height & Spacing:**
- Headings: `leading-tight` (1.25) — creates visual tension, modern feel
- Body text: `leading-relaxed` (1.625) — improves readability, premium feel
- Lists/dense content: `leading-normal` (1.5)

**Emphasis & Hierarchy Patterns:**
- **Primary heading**: `text-4xl font-black tracking-tight text-white` — full power
- **Secondary heading**: `text-2xl font-bold tracking-tight text-white` — strong but secondary
- **Link text**: `text-sm font-medium text-accent-primary hover:text-accent-primary-dark transition-colors` — always underline on hover
- **Badge/Label**: `text-xs font-semibold uppercase tracking-widest` — for status labels, section dividers
- **Error message**: `text-sm text-accent-danger font-medium` — clear, not subtle

### Signature Design Element — Resistance Score Gauge (Evolved)

The **Resistance Score Gauge** is a refined circular arc progress indicator appearing on campaign cards, live dashboards, and the AAR. This is PhishYou's visual fingerprint.

**Visual Specification:**
- **Base Arc**: Drawn in `--color-border-light` (#3D4860) as a full circle background, providing subtle visual anchor
- **Progress Arc**: Layered atop, using a three-stage color transition:
  - **0.0–0.33** (Low resistance): `--color-accent-success` (#06D369) — fresh, optimistic green
  - **0.33–0.67** (Medium resistance): Smooth gradient transition from green → amber
  - **0.67–1.0** (High resistance): `--color-accent-danger` (#FF4757) — warm red, indicating risk
  
- **Glow Effect** (when active/live): Subtle `box-shadow` using `--shadow-glow-teal` for low resistance, `--shadow-glow-danger` for high resistance. Intensity increases with resistance score.

- **Animation**:
  - At low resistance (< 0.3): **Static**, no pulse
  - At medium resistance (0.3–0.7): **Gentle pulse** (opacity 0.8 → 1.0, duration 2s, ease-in-out)
  - At high resistance (> 0.7): **Urgent pulse** (opacity 0.7 → 1.0, duration 1.2s, ease-in-out) + warm red glow

- **Size Variants**:
  - Campaign card display: `w-12 h-12` (medium)
  - Dashboard tiles: `w-16 h-16` (large)
  - AAR report: `w-20 h-20` (hero size, with larger glow radius)

**Implementation Note**: Render using SVG `<circle>` and `<path>` elements with `stroke-dasharray` and `stroke-dashoffset` for arc progress. Use CSS animations for pulse effects, not JavaScript polling.

### Animations & Micro-Interactions — Purposeful Motion

**Philosophy**: Motion should feel *organic and intentional*, not flashy. Use animations to guide attention, provide feedback, and create delight—never distract. All animations should respect `prefers-reduced-motion` for accessibility.

**Global Animation Keyframes** (add to Tailwind config or CSS):

```css
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideOutRight {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(20px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; box-shadow: 0 0 20px rgba(47, 217, 199, 0.2); }
  50% { opacity: 1; box-shadow: 0 0 30px rgba(47, 217, 199, 0.4); }
}

@keyframes pulseGlowDanger {
  0%, 100% { opacity: 0.8; box-shadow: 0 0 20px rgba(255, 71, 87, 0.2); }
  50% { opacity: 1; box-shadow: 0 0 30px rgba(255, 71, 87, 0.4); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes scale-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

**Standard Animation Durations & Easing:**
- **Micro-interactions** (button hover, icon change): `200ms ease-out`
- **Transitions** (tab switch, modal open): `300ms ease-out`
- **Page transitions**: `400ms ease-out`
- **Looping animations** (pulse, loading): `2000ms ease-in-out` (or `1200ms` for urgent states)

**Specific Animation Use Cases:**

| Element | Animation | Duration | Easing | Trigger | Effect |
|---|---|---|---|---|---|
| **Button Hover** | Scale + color shift | 200ms | ease-out | `:hover` | Slight scale (1.02), text color shifts to primary-dark |
| **Button Click** | Subtle press | 150ms | ease-out | `:active` | Scale 0.98, opacity 0.9 |
| **Link Hover** | Underline slide + color | 200ms | ease-out | `:hover` | Underline appears, color shifts to primary-dark |
| **Modal Open** | Fade + slide-in | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Trigger open | Backdrop fades in, modal slides down from top |
| **Toast Notification** | Slide-in right + fade | 300ms | ease-out | Toast mount | Slides in from right, auto-dismiss with fade-out |
| **Dropdown Open** | Fade + scale-up | 150ms | ease-out | Click | Slight scale-up from origin point, fade in |
| **Live Indicator Pulse** | Glow pulse | 2000ms | ease-in-out | Active campaign | Continuous pulse, gets more intense at higher resistance |
| **Gauge Arc Animation** | Stroke animation | 1000ms | ease-in-out | Score update | Arc fills smoothly from current to new value |
| **Loading State** | Shimmer + spin | 2000ms + 1000ms | linear | Loading | Subtle shimmer across bar + subtle rotation for icons |
| **Tab Switch** | Fade + indicator slide | 250ms | ease-out | Tab click | Content fades, indicator bar slides to new tab |
| **Expandable Section** | Height transition | 250ms | ease-out | Click | Smooth height change, no jump |
| **Hover Overlay** | Subtle fade | 200ms | ease-out | `:hover` | Background overlay (--overlay-hover) fades in |
| **Success Checkmark** | Bounce-in scale | 400ms | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Success event | Icon scales in with bounce, lands at 1.0 |
| **Error Shake** | Horizontal wiggle | 300ms | ease-in-out | Error validation | Input shakes left-right 3x, draws attention |

**Accessibility Requirement:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
This ensures animations respect user preferences for reduced motion (OS-level setting).

### Spacing & Layout

- Page max-width: `max-w-7xl mx-auto px-6` (desktop), `px-4` (mobile)
- Card padding: `p-5` or `p-6` — generous, never cramped
- Grid system: 12-column CSS grid via Tailwind grid utilities
- Section vertical rhythm: `space-y-6` or `space-y-8` between major sections
- Gap between card items: `gap-4` (mobile), `gap-6` (desktop) — breathing room

### Component Conventions — Refined & Intentional

**Button Styling** (shadcn/ui `Button` + custom overrides):
- **Primary buttons** (`variant="default"`): 
  - Background: `--color-accent-primary` (#2FD9C7)
  - On hover: gradient to `--color-accent-primary-light`, scale to 1.02, subtle glow shadow
  - On active: scale 0.98, opacity 0.85
  - Text: white, weight 600, uppercase 1-2px tracking for premium feel
  - Rounded: `rounded-lg` (8px radius — modern, not pill-shaped)
  
- **Secondary buttons** (`variant="secondary"`):
  - Background: `--color-border` (#2D3748)
  - Border: 1px solid `--color-border-light`
  - On hover: background shifts to `--color-bg-subtle`, border brightens
  - Maintains same scale/shadow behavior as primary
  
- **Destructive buttons** (`variant="destructive"`):
  - Background: `--color-accent-danger` (#FF4757)
  - Glow shadow: `--shadow-glow-danger` on hover
  - Same transitions and scales as primary
  - Convey urgency without flashing
  
- **Ghost buttons** (`variant="ghost"`):
  - No background by default, text-only
  - On hover: subtle background overlay (`--overlay-hover`), text color to primary
  - Used for tertiary actions, links within dense layouts
  
- **Button sizing**:
  - Small (`size="sm"`): `px-3 py-1.5 text-xs`
  - Default (`size="default"`): `px-4 py-2.5 text-sm`
  - Large (`size="lg"`): `px-6 py-3 text-base`
  - Icon-only: `p-2 w-9 h-9` (square buttons for header actions)

**Form Inputs** (shadcn/ui Input/Select/Textarea):
- **Border**: Default `--color-border`, on focus `--color-border-active` (#2FD9C7)
- **Background**: `--color-bg-elevated` by default
- **Placeholder text**: `--color-text-muted`, no opacity reduction (maintain contrast)
- **Focus ring**: `ring-2 ring-offset-0 ring-accent-primary` (emerald-teal ring)
- **Rounded**: `rounded-lg` (8px — consistency with buttons)
- **Padding**: `px-3 py-2.5` for better touch targets, breathing room
- **Transition**: 200ms ease-out for border and ring color
- **Disabled state**: background `--color-bg-subtle`, opacity 0.5, cursor not-allowed

**Checkboxes & Switches**:
- Checked color: `--color-accent-primary` (emerald-teal)
- Smooth transitions on toggle: 200ms ease-out
- Larger hit target than default: `w-5 h-5` minimum

**Dialogs & Modals** (shadcn/ui Dialog):
- Backdrop: `--overlay-muted` (40% opacity black)
- Animation: fade + slide-in from top, 300ms ease-out
- Content background: `--color-bg-elevated`
- Border: 1px solid `--color-border`
- Rounded: `rounded-xl` (12px — softer for modals)
- Padding: `p-6`
- Shadow: `--shadow-lg` for depth

**Tooltips** (shadcn/ui Tooltip):
- Background: `--color-bg-base`
- Border: 1px solid `--color-border`
- Text: `text-xs` white
- Arrow: inherit border color
- Delay: 200ms before show

**Data Tables** (shadcn/ui Table):
- **Header row**: background `--color-bg-subtle`, text weight 600, uppercase label
- **Body rows**: background `--color-bg-surface`, border-bottom `--color-border-subtle`
- **Row hover**: background shifts to `--color-bg-subtle` + overlay-hover, transition 150ms
- **Alternating rows** (optional): subtle striping using `--overlay-hover` at 50% opacity
- **Sortable column icon**: appears on header hover, animates on sort
- **Density**: default row height `h-12` (48px), compact `h-10` (40px) option

**Badges & Status Labels** (shadcn/ui Badge):
- **Base styling**: `rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider`
- **Active** (`text-cyan-400 bg-cyan-400/10`): Replace cyan with primary (`text-accent-primary bg-accent-primary/10`), add subtle pulse on active campaigns
- **Paused** (`text-amber-400 bg-amber-400/10`): Keep as is, clear meaning
- **Completed** (`text-green-400 bg-green-400/10`): Replace with success color
- **Compromised** (`text-red-500 bg-red-500/15`): Replace red with danger color
- **Defended** (`text-green-400 bg-green-400/10`): Use success color
- **Custom tiers**: 
  - Tier A: `bg-red-500/15 text-danger px-2 py-1 rounded-md text-xs` (more prominent, use with gradient background optional)
  - Tier B: `bg-amber-400/10 text-warning px-2 py-1 rounded-md text-xs`
  - Tier C: `bg-green-400/10 text-success px-2 py-1 rounded-md text-xs`

**Loading States** (skeleton shimmer):
- Skeleton bars: `bg-gradient-to-r from-[--color-bg-subtle] via-[--color-bg-surface] to-[--color-bg-subtle]`
- Animation: `animate-shimmer` (left-to-right wave, 2000ms linear)
- Placeholder height: matches expected content height
- Rounded: `rounded-lg` for consistency
- Never show loading state longer than 2 seconds (re-fetch if slower)

### Status Color Conventions (Refined & Consistent)

| Status | Tailwind Base | Badge Class | Semantic Color | Usage |
|---|---|---|---|---|
| ACTIVE | — | `bg-accent-primary/10 text-accent-primary` | --color-accent-primary | Ongoing campaigns, live data |
| PAUSED | — | `bg-warning/10 text-warning` | --color-accent-warning | Campaigns on hold, pending states |
| COMPLETED | — | `bg-success/10 text-success` | --color-accent-success | Finished campaigns, resolved alerts |
| HALTED | — | `bg-danger/10 text-danger` | --color-accent-danger | Stopped campaigns, critical issues |
| COMPROMISED | — | `bg-danger/15 text-danger font-semibold` | --color-accent-danger | Target compromised, breach |
| DEFENDED | — | `bg-success/10 text-success` | --color-accent-success | Successful defense, security positive |
| BLOCKED | — | `bg-neutral/10 text-neutral` | --color-accent-neutral | Blocked targets, failed attempts |
| PENDING | — | `bg-neutral/10 text-tertiary` | --color-text-tertiary | Awaiting action, review queue |

**Important Refinement**: Replace generic cyan status colors throughout the old spec with `--color-accent-primary` (#2FD9C7). This creates visual consistency around the emerald-teal accent system.

---

### Modern Visual Patterns & Refinements

**Card Design** (premium, subtle elevation):
- Background: `--color-bg-surface`
- Border: 1px solid `--color-border`, not black
- Rounded: `rounded-xl` (12px — modern, soft corners)
- Shadow: `--shadow-sm` on default, `--shadow-md` on hover
- Padding: `p-6`
- Transition on hover: 200ms ease-out, subtle scale (1.01), background brightens slightly
- *Never use harsh borders or pure black — everything flows*

**Dividers & Separators**:
- Use `--color-border-subtle` for soft dividers between sections
- Height: `1px` (never thicker)
- Optionally use `border-dashed` for conceptual separators (between logical groups)
- Never span full width — use `mx-6` to inset dividers in cards

**Hover State Pattern** (unified across all interactive elements):
```css
.interactive-element {
  transition: all 200ms ease-out;
  
  &:hover {
    background-color: var(--overlay-hover);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-xs);
  }
}
```

**Focus State Pattern** (for keyboard navigation & accessibility):
```css
.focusable {
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--overlay-focus), 0 0 0 4px var(--color-accent-primary);
  }
}
```

**Section Headers** (above card grids):
- Style: `text-xl font-bold tracking-tight text-white mb-4`
- Optional accent bar: `border-l-4 border-accent-primary pl-3` (left border accent, very modern)
- Subtitle variant: `text-sm text-secondary font-normal` (under main heading)

**Icon Styling**:
- Default: `w-5 h-5 text-secondary` (inherit text color in most cases)
- Accent variant: `w-5 h-5 text-accent-primary` (for interactive, selected, or emphasized)
- Large variant (hero/empty state): `w-12 h-12 text-muted` (soft, not jarring)
- Active/pulse: `animate-pulse` or custom `pulseGlow` for live indicators
- Transition: `text-inherit` uses color transition of parent (no extra CSS needed)

**List Items & Density**:
- Compact list: `py-2 px-3` per item
- Standard list: `py-3 px-4` per item
- Spacious list: `py-4 px-5` per item
- Always use `border-b border-border-subtle` between items
- Last item: no bottom border

**Cards with Metadata** (common pattern):
```
[Headline]        — text-lg font-bold
[Description]     — text-sm text-secondary
---               — border-border-subtle
[Metrics Row]     — flex justify-between, text-xs text-tertiary + values in white
[CTA]             — button at bottom right
```

**Grid Layouts** (responsive):
- Desktop (`> 1024px`): 3-column, `grid-cols-3 gap-6`
- Tablet (`768px–1024px`): 2-column, `grid-cols-2 gap-5`
- Mobile (`< 768px`): 1-column, `grid-cols-1 gap-4`
- Use Tailwind responsive prefixes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

**Empty State Pattern**:
- Centered vertical alignment
- Icon: `w-12 h-12 text-muted mb-4`
- Heading: `text-lg font-semibold text-secondary mb-2`
- Description: `text-sm text-tertiary mb-6`
- CTA: Primary button with action
- Tone: Friendly, encouraging, never apologetic

---

## Application Routes

```
/                          → Redirect to /dashboard
/login                     → Authentication Page
/dashboard                 → Main Dashboard (Overview)
/campaigns                 → Campaign List Page
/campaigns/new             → Create Campaign (multi-step wizard)
/campaigns/:id             → Campaign Detail Page
/campaigns/:id/live        → Live Campaign Monitor
/campaigns/:id/aar         → After-Action Report Viewer
/targets                   → Target Management
/targets/new               → Add Target(s)
/targets/:id               → Target Profile Page
/personas                  → Persona Library
/personas/:id              → Persona Detail
/analytics                 → Analytics Hub
/analytics/threats         → Threat Pattern Intelligence
/consent                   → Consent Management
/consent/new               → Create Consent Form
/audit                     → Audit Log Viewer
/settings                  → Organization Settings
/settings/compliance       → Compliance & Legal Settings
/settings/team             → Team & Roles Management
/settings/integrations     → Platform Integrations (Twilio, SMTP, etc.)
/help                      → Help & Documentation
```

---

## Shared Layout Components

### Component: `<AppShell>` — Refined Navigation & Layout

The persistent wrapper rendered on every authenticated page (all routes except `/login`). This is the frame of the entire app—make it exceptional.

**Structure:**
- Fixed left sidebar (`w-64` on desktop, hidden on mobile, `bg-bg-base`, subtle border-right)
- Top header bar (`h-16` fixed, `z-40` — slightly taller for breathing room, `bg-bg-base`)
- Main content area (`flex-1 overflow-y-auto ml-64 mt-16` — accounts for fixed header)
- Mobile bottom navigation bar (visible only on `<768px` viewport, `h-16`, fixed bottom, `z-40`)
- Content padding: all pages have `px-6 py-8` minimum to prevent edge-touching content

**Header Styling:**
- Background: `--color-bg-base` with subtle border-bottom `--color-border-subtle`
- Shadow: minimal `--shadow-xs` (only on mobile to distinguish from content)
- Height: `h-16` (64px) — gives UI breathing room
- Flex layout: `flex items-center justify-between`
- Z-index: `z-40` (below modals at `z-50`)

**Top Header Bar elements (left to right):**
- Logo mark: `PhishYou` wordmark in `text-lg font-black text-white` with a small shield icon (lucide `Shield`) in `text-cyan-400` to its left
- Spacer (flex-grow)
- Live campaigns indicator: small pulsing cyan dot + `text-xs text-cyan-400` text like "3 campaigns live" — only visible when campaigns are active; clicking navigates to `/campaigns?filter=active`
- Notification bell icon (`Bell` from lucide) with a red badge count if unread alerts exist; clicking opens a `Popover` with a notification list (see Notification Popover below)
- Avatar + org name dropdown: shows logged-in user's initials in a circular avatar (`w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold`), clicking opens a dropdown with "Profile", "Organization Settings", "Logout"

**Left Sidebar elements:**
- Organization name at the top in `text-xs text-slate-400 uppercase tracking-widest px-4 pt-5 pb-2`
- Navigation grouped into sections with section labels styled `text-xs text-slate-500 uppercase tracking-wider px-4 mb-1 mt-4`

Navigation sections and items:
```
OVERVIEW
  - Dashboard          (icon: LayoutDashboard)
  - Analytics          (icon: BarChart3)

CAMPAIGNS
  - All Campaigns      (icon: Target) — shows campaign count badge
  - Create Campaign    (icon: Plus, styled as accent button)

INTELLIGENCE
  - Threat Patterns    (icon: Activity)
  - Persona Library    (icon: Users)

ADMINISTRATION
  - Target Management  (icon: UserCheck)
  - Consent & Legal    (icon: FileCheck)
  - Audit Logs         (icon: ScrollText)
  - Settings           (icon: Settings)
```

Each nav item: `flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors`. Active item: `text-white bg-white/10 font-medium`.

**Notification Popover:**
- Width `w-80`, max height `max-h-96 overflow-y-auto`
- Each notification: icon (colored by severity) + title `text-sm font-medium` + timestamp `text-xs text-slate-400` + message `text-xs text-slate-300`
- Notification types: `HARM_DETECTED` (red icon `AlertTriangle`), `CAMPAIGN_COMPLETED` (green `CheckCircle2`), `TARGET_BLOCKED` (purple `ShieldOff`), `DEBRIEF_OVERDUE` (amber `Clock`), `ADMIN_ACTION` (blue `Info`)
- "Mark all read" button at top right of popover
- "View all alerts" link at bottom

**Mobile Bottom Nav (visible only < 768px):**
- 5 icon tabs: Dashboard, Campaigns, Targets, Analytics, Settings
- Active tab highlighted in cyan

---

## PAGE 1: Authentication Page (`/login`)

**Purpose:** Secure login for organization admins. No public registration — accounts are provisioned by PhishYou.

**Full-page layout:** Split screen on desktop (`lg:grid lg:grid-cols-2`), single column on mobile.

**Left Panel (decorative, hidden on mobile `hidden lg:flex`):**
- Background: `bg-[#0A0D14]` with a subtle radial gradient in the top-right corner `from-blue-900/30 to-transparent`
- Large PhishYou wordmark + tagline: `"Enterprise Social Engineering Simulation"` in `text-sm text-slate-400`
- Below: 3 stat boxes in a vertical list, each showing a metric like `"94% Attack Realism Score"`, `"60+ Attack Vectors"`, `"10 Min AAR Generation"` — styled as `border border-slate-700 rounded-lg p-4 bg-white/5`
- Bottom: compliance badge strip showing GDPR, SOC2, ISO27001 logos in grayscale

**Right Panel (login form):**
- Centered vertically and horizontally in its half
- "Welcome back" in `text-3xl font-black text-white`
- "Sign in to your organization account" in `text-sm text-slate-400 mt-1 mb-8`
- Form fields (using shadcn/ui `Input`):
  - Label: `"Organization Email"`, input type `email`, placeholder `"admin@company.com"`, autocomplete `email`
  - Label: `"Password"`, input type `password`, placeholder `"••••••••"`, autocomplete `current-password`
  - Right-aligned link below password field: `"Forgot password?"` in `text-xs text-blue-400 hover:text-blue-300`
- Submit button: full-width `Button` with text `"Sign In"` — shows `Loader2` spinner icon while loading
- Error state: inline error below the form — `text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2`
- Below the button: `"Need access? Contact your PhishYou administrator."` in `text-xs text-slate-500 text-center mt-4`
- MFA step: if org requires MFA, after password validation the form transitions (fade) to show a 6-digit OTP input — `grid grid-cols-6 gap-2` of individual `w-10 h-10 text-center text-xl font-mono` inputs
- All form state managed with `useState`; submission calls `/oauth/token`; JWT stored in memory (not localStorage per security constraints); React context holds the auth state

---

## PAGE 2: Dashboard (`/dashboard`)

**Purpose:** Command center. First page seen after login. Gives the CISO/admin an immediate sense of what's happening right now and what matters.

**Page title:** `"Command Center"` — `text-3xl font-black text-white`

**Sub-title / date:** current date in `text-sm text-slate-400`

### Section 2.1: KPI Strip (top row)

A `grid grid-cols-2 lg:grid-cols-4 gap-4` row of metric cards. Each card:

```
bg-[#111827] border border-[#2D3748] rounded-xl p-5
```

Cards (in order):

**Card 1: Active Campaigns**
- Large number in `text-4xl font-black text-cyan-400` (e.g., `"3"`)
- Label: `"Campaigns Live"` in `text-sm text-slate-400`
- Bottom: mini horizontal bar showing campaign tier breakdown — colored segments for Tier A (red), B (amber), C (green)

**Card 2: Targets Engaged**
- Number in `text-4xl font-black text-white`
- Label: `"Employees Targeted This Month"`
- Bottom: `text-xs text-slate-400` — e.g., `"14 defended · 6 compromised · 3 active"`

**Card 3: Org Human Risk Score**
- Large percentage or score in `text-4xl font-black` — colored red if high risk (>60), amber if medium (30-60), green if low (<30)
- Label: `"Human Risk Score"`
- Trend indicator: small up/down arrow with `text-xs` delta vs last campaign — e.g., `"↓ 12pts from last month"` in green if improving

**Card 4: Open Policy Gaps**
- Number in `text-4xl font-black text-amber-400`
- Label: `"Policy Gaps Detected"`
- Bottom: breakdown of severities — e.g., `"2 critical · 3 high · 4 medium"` each word in its severity color

### Section 2.2: Live Campaign Feed

Full-width panel, `bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Header row: `"Live Campaigns"` heading + pulsing cyan dot + `"Real-time"` badge on the right

If no campaigns are active: empty state with a `Target` icon (lucide, `w-12 h-12 text-slate-600`), `"No campaigns running"` heading, `"Start a campaign to see live activity here."` subtext, and a `Button` variant `default` → navigates to `/campaigns/new`.

If campaigns are active, renders a list of `CampaignLivePill` components (one per active campaign):

**`CampaignLivePill` component:**
- `flex items-center justify-between border-b border-[#2D3748] py-4 last:border-0`
- Left: Campaign name in `text-sm font-semibold text-white` + target name in `text-xs text-slate-400` below it + platform icons row (small `Mail`, `MessageCircle`, `Phone` icons from lucide sized `w-3.5 h-3.5 text-slate-500`)
- Center: Resistance score gauge — a 48px circular arc SVG in cyan/amber/red based on score value, with the numeric score inside in `text-xs font-mono font-bold`
- Right: tier badge (colored per tier) + `"View Live"` `Button` variant `outline` size `sm` → navigates to `/campaigns/:id/live`
- The entire pill has a very subtle left border: `border-l-2 border-cyan-500` for active campaigns

### Section 2.3: Two-column lower section

`grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6`

**Left: Recent Activity Feed**

Panel `bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Header: `"Recent Activity"` + `"View all"` link (small, right-aligned) → `/audit`

List of audit events (max 8), each event styled as:
- `flex items-start gap-3 py-3 border-b border-[#2D3748] last:border-0`
- Colored icon in a `w-8 h-8 rounded-full flex items-center justify-center` — color by event type
- Event title in `text-sm font-medium text-white`
- Description in `text-xs text-slate-400`
- Timestamp in `text-xs text-slate-500 ml-auto` (right-aligned, shows relative time like "3 min ago")

Event types and their icons:
- Campaign started: `PlayCircle` — cyan
- Campaign halted: `StopCircle` — red
- Target defended: `ShieldCheck` — green
- Target compromised: `ShieldX` — red
- Harm detected: `AlertTriangle` — amber
- Admin action: `UserCog` — blue
- Debrief delivered: `BookOpen` — purple

**Right: Trigger Effectiveness Chart**

Panel `bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Header: `"Trigger Effectiveness (Last 30 Days)"`

A horizontal bar chart using recharts `BarChart` oriented horizontally. Y-axis: trigger names (Authority, Urgency, Fear, Social Proof, Reciprocity). X-axis: effectiveness 0–100%. Each bar colored in the accent-purple gradient. On hover, tooltip shows exact % and sample count.

Below chart: `text-xs text-slate-500 text-center` — `"Based on N engagements across M campaigns"`

### Section 2.4: Compliance Health Strip

A `grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4`

Each compliance item is a small card:
- Icon (`CheckCircle2` green if compliant, `XCircle` red if not, `Clock` amber if pending)
- Label: framework name (GDPR, SOC2, HIPAA, CCPA)
- Status text below

Below the grid: `"Last compliance review: [date]"` in `text-xs text-slate-500`

---

## PAGE 3: Campaign List (`/campaigns`)

**Purpose:** Browse, filter, and manage all campaigns.

**Page header:**
- Title: `"Campaigns"` in `text-3xl font-black text-white`
- Right side: `Button` with `Plus` icon + `"Create Campaign"` → navigates to `/campaigns/new`

### Section 3.1: Filter & Search Bar

`flex flex-wrap items-center gap-3 mt-4 mb-6`

Elements (left to right):
- Search input: `Input` with `Search` icon inside left padding, placeholder `"Search campaigns..."`, `w-64`, calls filter logic on `onChange` (debounced 300ms)
- Status filter: shadcn/ui `Select` with options: All, Active, Paused, Completed, Halted — `w-36`
- Tier filter: shadcn/ui `Select` with options: All Tiers, Tier A, Tier B, Tier C — `w-32`
- Platform filter: `Select` with options: All, Email, WhatsApp, Voice, LinkedIn, Instagram, SMS — `w-36`
- Date range: two `Input type="date"` fields ("From" and "To") — `w-36` each
- `"Clear filters"` ghost button, only visible when any filter is active

### Section 3.2: Results Summary

`"Showing N of M campaigns"` in `text-sm text-slate-400`

Right side: View toggle — two icon buttons for grid view (`LayoutGrid`) and table view (`List`), with the active one highlighted. Default: table view.

### Section 3.3: Campaign Table (default view)

shadcn/ui `Table` inside `bg-[#111827] border border-[#2D3748] rounded-xl overflow-hidden`

Columns:
1. **Campaign** — campaign name (bold, `text-white font-semibold text-sm`) + org name below in `text-xs text-slate-400`; clicking the name navigates to `/campaigns/:id`
2. **Status** — `Badge` with status color conventions
3. **Tier** — `Badge` with tier color (A=red, B=amber, C=green) + label "Tier A" etc.
4. **Targets** — number in `text-sm text-white` + `text-xs text-slate-400` breakdown "3 active · 2 done"
5. **Platforms** — row of platform icons: `Mail`, `MessageCircle`, `Phone`, `Linkedin`, `Instagram`, `Smartphone` from lucide — each shown only if that platform is in the campaign; colored `text-slate-400`, sized `w-4 h-4`
6. **Progress** — thin horizontal progress bar (Tailwind `h-1 rounded-full bg-slate-700`) with a filled segment in cyan representing (compromised + defended) / total targets
7. **Started** — date in `text-sm text-slate-300` using `Intl.DateTimeFormat`
8. **Actions** — three-dot `DropdownMenu` with items: "View Details", "View Live" (only if active), "View AAR" (only if completed), "Halt Campaign" (only if active, destructive style), "Duplicate"

Table rows have `hover:bg-white/5 cursor-pointer` transition.

**Pagination:** below table — shadcn/ui-style pagination with `"Previous"` / `"Next"` buttons + page number pills. Shows `"Page N of M"` in `text-sm text-slate-400` center.

### Section 3.4: Campaign Grid View (alternate view)

`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`

Each **Campaign Card:**

```
bg-[#111827] border border-[#2D3748] rounded-xl p-5 hover:border-blue-500/40 transition-colors cursor-pointer
```

Top row: campaign name truncated `text-sm font-semibold text-white` + status badge (right-aligned)

Middle: tier badge + `text-xs text-slate-400` start date

Platform icons row: same icons as table, `mt-2`

Large resistance gauge section: a 72px circular arc gauge showing average resistance across all targets — the signature element for this view

Bottom row: target counts with icons, `"View"` button variant `ghost` size `sm`

---

## PAGE 4: Create Campaign — Multi-Step Wizard (`/campaigns/new`)

**Purpose:** Guide admins through the full campaign configuration. This is the most complex form in the app.

**Layout:** Full-page centered layout, max-width `max-w-3xl mx-auto`, with a sticky progress indicator at the top.

**Progress Indicator:**

A horizontal stepper:

```
Step 1        Step 2           Step 3          Step 4         Step 5
Campaign      Targets &        Attack           Platform &     Review &
Basics        Consent          Configuration    Media          Launch
```

Each step: circle with step number (filled cyan when complete, filled white for current, dark outline for future) + label below. Steps connected by horizontal line (`border-t border-[#2D3748]` that becomes `border-blue-500` for completed steps).

Current step label is `text-sm font-semibold text-white`; others `text-sm text-slate-400`.

Below the stepper: `text-xs text-slate-500 text-center mt-2` — `"Step N of 5"`

---

### Step 1: Campaign Basics

**Form fields:**

**Campaign Name** (required)
- `Input` type `text`, placeholder `"e.g., Finance Team Payment Verification Q3"`, max 255 chars
- Character count below: `"N / 255"` in `text-xs text-slate-400 text-right`

**Campaign Type** (required)
- shadcn/ui `Select` with options:
  - `email_credential_harvest` — "Email: Credential Harvest"
  - `whatsapp_payment` — "WhatsApp: Payment Verification"
  - `multi_channel_authority` — "Multi-Channel: Authority Escalation"
  - `social_recruiter_harvest` — "Social: Recruiter Credential Harvest"
  - `regional_fintech` — "Regional Fintech (Roman Urdu)"
  - `cognitive_load` — "Cognitive Load Attack (Tier A only)"

**Tier Selection** (required)

Three large clickable cards in a `grid grid-cols-3 gap-3`:

Each tier card:
- Border: `border-2 rounded-xl p-4 cursor-pointer transition-all`
- Unselected: `border-[#2D3748] bg-[#111827]`
- Selected: tier-specific border color (A: `border-red-500 bg-red-500/5`, B: `border-amber-500 bg-amber-500/5`, C: `border-green-500 bg-green-500/5`)
- Large `"A"` / `"B"` / `"C"` in the tier color, `text-3xl font-black`
- Name: `"Aggressive"` / `"Balanced"` / `"Cautious"` in `text-sm font-semibold`
- 3 bullet points of key attributes in `text-xs text-slate-400`:
  - Tier A: "Unlimited persistence · No daily caps · No harm detection"
  - Tier B: "2 escalation levels · 1 pause/day · Optional harm detection"
  - Tier C: "10 msgs/day · 72h cool-off · Mandatory harm detection"
- If Tier A is selected, a warning banner appears below the card grid:
  - `bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2`
  - `AlertTriangle` icon (red) + `"Tier A requires executive sponsor sign-off and enhanced legal attestation."` in `text-xs text-red-300`

**Campaign Duration**

`flex items-center gap-3`:
- Number `Input` type `number` min `1` max `365`, `w-24`
- `Select` for unit: "Days" / "Hours"
- Label beside: `"Campaign ends automatically after this period."`

**Primary Objective** — `Select` with: Credential Harvest, Payment Diversion, Data Disclosure Test, Policy Stress Test

**Notes / Context** (optional)
- `Textarea` rows 3, placeholder `"Internal notes for your security team. Not visible to targets."`, max 1000 chars

**Navigation:** `"Next: Targets & Consent →"` `Button` variant `default` (right-aligned). Validates all required fields before proceeding — shows inline validation errors if any are empty.

---

### Step 2: Targets & Consent

**Section: Add Targets**

Header: `"Who are you testing?"` `text-xl font-semibold`

Subtext: `"Every target must have a signed consent form on file before the campaign can launch."` in `text-sm text-slate-400`

Two ways to add targets:

**Option A: Individual Entry**
- `flex gap-3 items-end` row:
  - `Input` placeholder `"Full Name"`, `w-40`
  - `Input` placeholder `"Email"`, type `email`, `w-48`
  - `Input` placeholder `"Phone (optional)"`, `w-36`
  - `Select` for Department: list of common departments + "Other", `w-36`
  - `Select` for Role, `w-32`
  - `Button` `"Add"` variant `outline`

**Option B: CSV Upload**
- `"Or import via CSV"` label
- Drag-and-drop zone: `border-2 border-dashed border-[#2D3748] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors`
- `Upload` icon (lucide, `w-8 h-8 text-slate-500`)
- `"Drop CSV here or click to browse"` in `text-sm text-slate-400`
- `"Required columns: name, email, phone, department, role"` in `text-xs text-slate-500 mt-1`
- On upload: parses CSV client-side, shows a preview table of parsed rows with a `"N targets loaded"` success badge

**Targets Table (builds as targets are added):**

`bg-[#111827] border border-[#2D3748] rounded-xl overflow-hidden mt-4`

Columns: Name, Email, Phone, Department, Role, Consent Status, Remove

Consent Status column: shows `"On file"` (green `CheckCircle2` icon) or `"Missing"` (red `XCircle` icon + `"Upload consent"` link that opens a `Dialog`).

**Consent Upload Dialog:**
- Title: `"Upload Consent Form — [Target Name]"`
- Drag-and-drop zone for PDF upload
- Or: `"Generate from template"` button — navigates to `/consent/new?target=ID` in new tab
- Once a PDF is uploaded: shows filename + `CheckCircle2` + `"Uploaded successfully"`
- `"Save"` and `"Cancel"` buttons

**Section: Organizational Attestation**

If not already completed for this org, a checklist appears:

`bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mt-6`

Header: `"Organization Attestation Required"` with `AlertTriangle` amber icon

Checklist of `Checkbox` items (all must be checked to proceed):
- "We are authorized to conduct security simulations on our employees"
- "Legal team has reviewed PhishYou methodology"
- "All targets have signed explicit informed consent forms"
- "We will NOT use results for disciplinary action or termination"
- "We will conduct mandatory post-campaign debriefs within 24 hours"
- "We have EAP / psychological support available for employees"
- "We will comply with applicable laws (GDPR, CCPA, etc.)"

If Tier A: additional checkbox: `"An executive sponsor acknowledges Tier A's unlimited persistence and assumes full organizational responsibility."`

Below checklist: signature field:
- `Input` placeholder `"CISO Full Name"`, type `text`
- `Input` placeholder `"CISO Email"`, type `email`
- `"Sign & Attest"` `Button` — once clicked, records timestamp and shows `"Attested by [name] at [datetime]"` green confirmation

**Navigation:** `"← Back"` ghost button (left) + `"Next: Attack Configuration →"` `Button` (right, disabled until all consent items checked + at least 1 target added).

---

### Step 3: Attack Configuration

**Section: Persona Selection**

Header: `"Select Attack Persona"` with subtext `"Choose who the AI will impersonate"`

`grid grid-cols-2 lg:grid-cols-3 gap-3`

Each persona card:
- `border rounded-xl p-4 cursor-pointer transition-all` — selected: `border-blue-500 bg-blue-500/5`
- Persona avatar: a `w-12 h-12 rounded-full` with initials or a simulated headshot placeholder (colored circle with initial letter)
- Persona name: `text-sm font-semibold text-white`
- Role/org: `text-xs text-slate-400`
- Authority level indicator: 1-5 filled dots (`●●●○○`) in `text-cyan-400`
- Best trigger pairing: `text-xs text-slate-500` e.g., `"Authority + Urgency"`
- Platform icons the persona works on

Personas available:
- P-01: IT Support (John Smith)
- P-02: Bank Security Team
- P-03: CEO / Executive
- P-04: Trusted Colleague
- P-05: Recruiter
- P-06: Vendor Rep
- P-07: Government / Regulator (Tier A only — dimmed with lock icon if Tier A not selected)
- P-08: Delivery / Courier
- P-09: Telecom / Fintech Officer
- P-10: IT Security Lead

**Section: Psychological Triggers**

`"Primary Trigger"` — `Select` with options + descriptions:
- Authority — "Legitimate authority, policy citations, hierarchy"
- Urgency / Scarcity — "Time pressure, deadlines, shrinking windows"
- Fear — "Account compromise, unauthorized activity, job risk"
- Social Proof — "Peer compliance, department completion"
- Reciprocity — "Trust-building, favors, relationship leverage"

Each option shows a one-line description in `text-xs text-slate-400` within the select dropdown.

`"Secondary Trigger"` — same select, but excludes the primary trigger choice.

**Trigger Intensity** — horizontal slider:
- shadcn/ui `Slider` from 1 to 5
- Below: `text-xs text-slate-400` labels for each value: 1 = "Mild", 3 = "Moderate", 5 = "Maximum"
- If Tier C is selected, slider is capped at 3 and shows a `"Tier C caps intensity at 3"` note below in amber

**Attack Chain Pattern**

`"Select Attack Chain"` — dropdown `Select` with options:
- CHAIN-1: Credential Harvest — "The Mandatory Audit"
- CHAIN-2: Payment Diversion — "The CFO's Wire"
- CHAIN-3: Recruiter Harvest — "The Dream Offer"
- CHAIN-4: Colleague Lateral — "The Favor"
- CHAIN-5: Regional Fintech — "Account Verification" (Roman Urdu)
- CHAIN-6: Cognitive Overload — "Everything At Once" (Tier A only, dimmed otherwise)

Below the dropdown: a visual chain preview — horizontal pill sequence:
`Email[Authority]` → `WhatsApp[Urgency]` → `Voice[Authority]` — each pill styled `bg-[#1C2333] border border-[#2D3748] rounded-full px-3 py-1 text-xs` connected by `→` arrow in `text-slate-500`

**OSINT Context** (optional)

`Textarea` rows 4, placeholder:
```
Paste relevant context about the target:
- Recent projects or announcements
- Known communication patterns
- Organizational context (month-end close, audit season, etc.)
- Any details that make the simulation more realistic
```

Below: `text-xs text-amber-400` — `"⚠ Never paste real credentials, SSNs, or passwords. This field is policy-filtered."` 

**Escalation Settings**

If Tier A: `"Escalation is unlimited. The AI will cycle through all available escalation levels."` — static info text in `text-xs text-slate-400`

If Tier B: shows `"Max escalation levels: 2"` with note `"IT Support → Manager only. No C-suite escalation."`

If Tier C: shows `"Max escalation levels: 1"` with note `"Single persona only. No escalation."`

**Navigation:** `"← Back"` + `"Next: Platform & Media →"`

---

### Step 4: Platform & Media Configuration

**Section: Platform Selection**

Header: `"Delivery Channels"`

Subtext: `"Select the platforms this campaign will use. Only consented channels per each target will be active."`

`grid grid-cols-2 md:grid-cols-3 gap-3`

Each platform card (toggle on/off):
- Platform icon (large, `w-8 h-8`) + name
- When toggled ON: `border-blue-500 bg-blue-500/5`
- When toggled OFF: `border-[#2D3748] bg-[#111827] opacity-60`
- Small subtext: estimated effectiveness or note

Platforms:
- `Mail` — Email (SMTP)
- `MessageCircle` — WhatsApp
- `Smartphone` — SMS
- `Phone` — Voice Call
- `Linkedin` — LinkedIn
- `Instagram` — Instagram

Notes on toggle:
- If Voice is toggled on → show inline warning: `"Voice synthesis generates AI audio. Ensure voice consent category is checked."`
- If LinkedIn or Instagram is toggled on → show `"Requires dedicated simulation account setup in Settings → Integrations"`

**Section: Sender Identity**

`"Spoofed Sender Configuration"` heading

If Email is enabled:
- `Input` `"From Name"` — e.g., "IT Security Team"
- `Input` `"From Email"` — must match a verified simulation domain; if user types a non-verified domain, show inline error `"Domain not verified. Go to Settings → Integrations."`
- `Input` `"Reply-To Email"`

If WhatsApp/SMS is enabled:
- `Input` `"Display Name"` (what appears as sender name)
- `Select` `"From Number"` — dropdown of provisioned Twilio numbers for this org

If Voice is enabled:
- `Select` `"Caller ID"` — dropdown of provisioned numbers
- `Select` `"Voice Profile"` — options like "Professional Male (US)", "Professional Female (US)", "Pakistani Banker (Urdu)", etc.

**Section: Media Generation**

Toggle switches (`Switch` from shadcn/ui) with labels:

- `"Voice Messages"` — AI-generated voice notes; shows sub-options when enabled:
  - Language `Select`: English (US), English (UK), Roman Urdu
  - Tone `Select`: Urgent, Professional, Concerned, Authoritative
  - Preview: `"Generate Preview"` button — calls the voice generation API and plays a 5-second sample via an inline HTML5 `<audio>` element

- `"Document Generation"` — generates fake PDFs/receipts; shows sub-options when enabled:
  - Document type `Select`: Bank Receipt, Invoice, Policy Memo, Compliance Notice, Bank Statement

**Section: Send Schedule**

`"Contact Window"` — time range pickers:
- From: `Input` type `time`, default `09:00`
- To: `Input` type `time`, default `18:00`
- `Select` for timezone of target

`"Send on these days"` — `grid grid-cols-7 gap-1` of day toggle pills (Mon/Tue/Wed/Thu/Fri/Sat/Sun) — each a small button that toggles active state

If Tier A: `"Allow late-evening sends (after 20:00)"` `Switch` toggle with `text-xs text-amber-400` warning if enabled: `"Tier A permission required. Late-evening sends exploit reduced vigilance."`

**Section: Localization**

`"Campaign Language"` `Select`: English, Roman Urdu (Pakistan), Urdu (Script), French — shows `"Beta"` badge next to non-English options.

If Roman Urdu is selected: info banner `"This campaign will use localized phrases, timing adjustments (e.g., Friday prayer window avoided), and the P-09 / P-02 persona lineup. Review the Localization Guide for cultural sensitivity notes."` in `text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3`

**Navigation:** `"← Back"` + `"Next: Review & Launch →"`

---

### Step 5: Review & Launch

**Purpose:** Final summary before committing. Read-only view of all configuration.

Header: `"Campaign Summary"` — `text-xl font-semibold`

Subtext: `"Review all settings carefully. Once launched, Tier A campaigns cannot be downgraded."` — amber text if Tier A

**Summary Cards — 3-column grid on desktop, stacked on mobile:**

Card 1: "Campaign Basics" — name, type, tier badge, duration, objective

Card 2: "Targets" — count + names listed, consent status for each (green ✓ or red ✗)

Card 3: "Attack Configuration" — persona name, primary/secondary triggers, attack chain name, intensity level

Card 4: "Platforms" — icons of selected platforms, sender identities

Card 5: "Media" — voice enabled/disabled, document type if enabled, language

Card 6: "Schedule" — contact window, days, timezone

**Consent Verification Block:**

`bg-green-500/10 border border-green-500/30 rounded-xl p-5` if all consent items verified

Shows: `CheckCircle2` icon + `"All prerequisites verified"` + attested-by name + timestamp

OR: `bg-red-500/10 border border-red-500/30 rounded-xl p-5` if anything is missing, listing what's unresolved + `"Fix issues"` link to the relevant step

**Final Confirmation Checkbox:**

Single large `Checkbox` with label: `"I confirm this campaign is authorized, all targets have provided explicit consent, and this simulation will be used exclusively for security training purposes."` — must be checked to enable the Launch button.

**Launch Button:**

`"Launch Campaign"` — full-width `Button` with `Rocket` icon — disabled until confirmation checkbox is checked + all prerequisites verified

On click: shows a `AlertDialog` (shadcn/ui confirmation modal):
- Title: `"Launch Campaign?"`
- Description: `"This will immediately send the first attack messages to [N] targets. This action cannot be undone — only halted."`
- Cancel and `"Yes, Launch"` (destructive) buttons

After confirmation: shows loading state on button with `Loader2` spinner. On success, navigates to `/campaigns/:id` (the new campaign's detail page) with a `"Campaign launched successfully"` toast notification.

---

## PAGE 5: Campaign Detail (`/campaigns/:id`)

**Purpose:** Single source of truth for one campaign. Hub linking to live view, AAR, targets, and audit.

**Page header:**

`flex items-start justify-between`

Left:
- Campaign name in `text-3xl font-black text-white`
- Campaign type in `text-sm text-slate-400`
- Status badge + tier badge in a `flex gap-2 mt-2`

Right (action buttons, `flex gap-2`):
- If ACTIVE: `"View Live"` `Button` variant `outline` with `Activity` icon → `/campaigns/:id/live`
- If ACTIVE: `"Halt Campaign"` `Button` variant `destructive` with `StopCircle` icon → opens `AlertDialog` to confirm halt
- If COMPLETED or HALTED: `"View AAR"` `Button` variant `default` with `FileText` icon → `/campaigns/:id/aar`
- Always: three-dot `DropdownMenu` with: "Edit Notes", "Duplicate Campaign", "Export Data", "Delete"

**Breadcrumb:** `"Campaigns / [Campaign Name]"` in `text-sm text-slate-400`

### Section 5.1: Status Timeline

Horizontal milestone bar showing campaign lifecycle stages:

`Created → Consent Verified → Active → [Completed | Halted]`

Each milestone: circle (filled if reached, outline if future) + label below + timestamp in `text-xs text-slate-500`

If a milestone is the current state: the circle pulses with cyan glow (`animate-pulse`)

### Section 5.2: Metrics Row

`grid grid-cols-2 lg:grid-cols-5 gap-4`

Metrics:
- Total Targets (number)
- Compromised (red number + `ShieldX` icon)
- Defended (green number + `ShieldCheck` icon)
- Active Engagements (cyan + pulsing dot)
- Campaign Duration (time elapsed since start, live updating if active)

### Section 5.3: Target Engagement Table

`bg-[#111827] border border-[#2D3748] rounded-xl overflow-hidden`

Header: `"Target Engagements"` + `"N targets"` count badge

Table columns:
- **Target** — name + department + role in small text
- **Status** — status badge
- **Resistance** — the signature circular gauge (small, 36px) + numeric score
- **Exchanges** — count of total messages sent/received
- **Platform** — icon of active platform
- **Last Activity** — relative timestamp
- **Defense** — defense mechanism if resolved: e.g., `"Out-of-band verification"` or `"Blocked sender"` or `"—"` if ongoing
- **Actions** — `"View Conversation"` button (small, outline) that opens a `Dialog` showing the full message thread; if resolved, `"View AAR"` link

**Conversation Thread Dialog:**

`Dialog` max-width `max-w-2xl`

Shows message thread in chat-bubble style:
- AI messages: left-aligned bubbles, `bg-[#1C2333] border border-[#2D3748] rounded-xl rounded-tl-none p-3`
- Target messages: right-aligned bubbles, `bg-blue-600/20 border border-blue-500/30 rounded-xl rounded-tr-none p-3`
- Below each message: `text-xs text-slate-500` — timestamp + platform icon + resistance score (for target messages)
- Tactic labels: small badge below each AI message showing the tactic used (e.g., `"ESCALATE_AUTHORITY"` in purple)
- Message content in `text-sm font-mono leading-relaxed` (monospace for message content feels intelligence/terminal appropriate)

### Section 5.4: Platform Status Row

`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`

One card per platform used in the campaign:
- Platform icon + name
- Status: `"Active"` / `"Blocked"` / `"Not Deployed"` / `"Failed"`
- Messages sent count
- Delivery rate percentage

### Section 5.5: Configuration Sidebar

`bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Shows all campaign config in a read-only format:
- Persona used
- Primary + secondary triggers with effectiveness bars (thin horizontal bars showing current score)
- Attack chain
- Tier + tier parameters summary
- Duration + time remaining
- Schedule (contact window)
- Language

Below config: `"Edit configuration"` ghost button (only available if campaign is CREATED/PAUSED, not ACTIVE)

### Section 5.6: Audit Trail Preview

Last 5 audit events for this campaign, with `"View full audit log"` link → `/audit?campaign=ID`

---

## PAGE 6: Live Campaign Monitor (`/campaigns/:id/live`)

**Purpose:** Real-time command center for a running campaign. The most visually intense page in the app.

**Auto-refreshes every 5 seconds** via `setInterval` polling the campaign status API.

**Page layout:** Full-width, immersive — suppresses normal sidebar padding to use full viewport. Dark background extends edge-to-edge.

**Top bar (custom for this page):**

`fixed top-0 left-0 right-0 h-12 bg-[#0A0D14] border-b border-[#2D3748] z-50 flex items-center px-6 gap-4`

- `ChevronLeft` icon + `"Back to Campaign"` link
- Campaign name in `text-sm font-semibold text-white`
- Status badge with pulsing dot
- Tier badge
- Spacer
- `"Last updated: N seconds ago"` in `text-xs text-slate-500` (live updating)
- Refresh icon `RefreshCw` button (manual refresh trigger)
- **KILL SWITCH:** `"Halt Campaign"` `Button` variant `destructive` size `sm` with `StopCircle` icon — always visible and accessible, triggers `AlertDialog` before acting

**Main content area (`pt-12` to account for fixed bar):**

`grid grid-cols-1 lg:grid-cols-3 gap-4 p-4`

### Left Panel (col-span-2): Live Engagement Feed

`bg-[#111827] border border-[#2D3748] rounded-xl h-[calc(100vh-80px)] overflow-hidden flex flex-col`

Header: `"Live Engagements"` + count + live indicator (green pulsing dot)

Filter tabs: `"All"` | `"Compromised"` | `"Defended"` | `"Active"` — clicking filters the list

**Target list** (scrollable `overflow-y-auto flex-1`):

Each target row is an accordion-style card:

Collapsed state: `flex items-center gap-4 p-4 border-b border-[#2D3748] cursor-pointer hover:bg-white/5`
- Small avatar circle with initials
- Name + role in small text
- Status badge
- Resistance gauge (48px circular)
- Last message timestamp
- `ChevronDown` / `ChevronUp` icon

Expanded state (the thread view):
- Slides open revealing the chat bubble thread (same style as conversation dialog on Campaign Detail)
- At bottom of thread: `"AI is composing..."` text with `...` animated dots when the AI is processing a response
- If harm signal detected: `AlertTriangle` amber banner above the thread: `"Potential distress signal detected (score: 0.7). Campaign paused for this target."` + `"Resume"` and `"End Session"` buttons

### Right Panel (col-span-1): Live Analytics Sidebar

`space-y-4`

**Block 1: Resistance Distribution** (`bg-[#111827] border border-[#2D3748] rounded-xl p-4`)

Recharts `BarChart` showing resistance score distribution across all targets (X-axis: 0-1 score range buckets, Y-axis: target count). Updates live.

**Block 2: Current Tactic Breakdown** (`bg-[#111827] border border-[#2D3748] rounded-xl p-4`)

recharts `PieChart` showing what tactic the AI is currently using across all active engagements. Legend below with color coding.

**Block 3: Platform Activity** (`bg-[#111827] border border-[#2D3748] rounded-xl p-4`)

Real-time counters per platform:
- Each row: platform icon + name + messages sent count + delivery rate bar
- Updates every refresh cycle

**Block 4: Harm Detection Status** (`bg-[#111827] border border-[#2D3748] rounded-xl p-4`)

Shows current harm detection status:
- If Tier C (mandatory): `"Active — Auto-pause at score ≥ 0.4"` green indicator
- If Tier B + enabled: shows enabled with threshold
- If Tier A: `"Disabled — Organization assumes responsibility"` with amber note

Recent harm events list (if any): each event shows target name, score, timestamp, and action taken.

**Block 5: Admin Actions Log** (`bg-[#111827] border border-[#2D3748] rounded-xl p-4`)

Real-time log of actions taken during this session: campaign started, targets paused, resumes, halt actions — each with timestamp and actor name.

---

## PAGE 7: After-Action Report (`/campaigns/:id/aar`)

**Purpose:** The premium deliverable. This page must look and feel like a professional security report. Printable.

**Print styles:** a `<style>` block with `@media print { ... }` rules that hides the sidebar, top bar, and action buttons, and makes the report full-width and clean for PDF printing.

**Page header:**

`"After-Action Report"` in `text-3xl font-black text-white`

Campaign name + target name (if individual AAR) + date generated

`flex gap-2 mt-3`:
- `"Export PDF"` `Button` with `Download` icon — calls `window.print()`
- `"Share"` `Button` with `Share2` icon — copies a shareable link with token
- `"Back to Campaign"` ghost button

**Tab navigation** (shadcn/ui `Tabs`) across the top:

`"Executive Summary"` | `"Behavioral Timeline"` | `"Trigger Analysis"` | `"Policy Gaps"` | `"Coaching"` | `"Comparisons"`

---

### Tab 1: Executive Summary

**Campaign Outcome Banner:**

Full-width card with large outcome:
- DEFENDED: `bg-green-500/10 border-2 border-green-500/40` — `ShieldCheck` icon `w-16 h-16 text-green-400` centered + `"Successfully Defended"` heading + `"Employee resisted all social engineering attempts and used out-of-band verification."` subtext
- COMPROMISED: `bg-red-500/10 border-2 border-red-500/40` — `ShieldX` icon — `"Compromised"` + description of what the target yielded
- EXPIRED: neutral card

**Key Metrics Row** — `grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6`:
- Time to First Skepticism: `"2m 15s"` in bold
- Total Exchanges: count
- Campaign Duration: total time
- Resilience Score: large number with color coding

**Outcome Description Paragraph:**

Auto-generated prose summary in `text-sm text-slate-300 leading-relaxed bg-[#111827] border border-[#2D3748] rounded-xl p-5`:
e.g., `"Alice Johnson (Finance Manager) successfully defended against a multi-channel social engineering campaign over 18 minutes. Despite escalating authority pressure across Email, WhatsApp, and a synthesized voice call, she consistently demanded out-of-band verification and ultimately confirmed the attack's inauthenticity by calling the real CISO directly."`

**Attack Chain Used:**

Visual horizontal chain showing exact steps taken: `Email[Authority]` → `WhatsApp[Social Proof]` → `Voice[Authority+Fear]` — each step colored by trigger, with the "winning defense" step marked with `ShieldCheck` icon.

---

### Tab 2: Behavioral Timeline

**Visual timeline** — a vertically scrolling sequence of events:

Each event is a row:
- Left column: timestamp in `text-xs font-mono text-slate-400 w-20 text-right`
- Center: colored vertical line (cyan for AI, blue for target, red for harm, amber for admin)
- Right column: event card — `bg-[#111827] border border-[#2D3748] rounded-xl p-3`

Event types:
- **AI sends message:** shows truncated message content + tactics badge + triggers deployed badges
- **Target replies:** shows truncated content + resistance score gauge + emoji analysis badges (`"Emoji downshift detected"`, `"Latency spike: +240s"`, `"Explicit skepticism"`)
- **AI escalates:** `"Escalation to Level 2: Manager Persona"` with chevron-up icon
- **Media delivered:** `"Voice note delivered"` or `"Document sent"` with file type icon
- **Harm signal:** amber `AlertTriangle` card — `"Harm signal detected (score: 0.7) — Campaign auto-paused"`
- **Defense:** green `ShieldCheck` card — `"Out-of-band verification completed. Campaign ended as DEFENDED."`

Below each target message event: expandable section showing the detailed behavioral analysis:
- Resistance score breakdown (small bar chart with component weights: skepticism 35%, emoji 20%, latency 20%, sentiment 15%, questions 10%)
- Detected signals listed as small badges

**Resistance Score Chart:**

Recharts `LineChart` spanning the full width of the tab, showing resistance score over time (X = message number, Y = 0 to 1.0). The line changes color as it crosses thresholds (green below 0.3, amber 0.3-0.6, red above 0.6). A horizontal dashed line marks each tier threshold. Tooltips on hover show message content preview.

---

### Tab 3: Trigger Analysis

**Trigger Effectiveness Table:**

shadcn/ui `Table` with columns:
- Trigger name
- Times deployed
- Mean resistance delta (positive = made target more resistant, negative = made them more compliant)
- Best response
- Worst response
- Effectiveness rating: stars or `●●●○○` dots

**Trigger Journey Chart:**

Recharts `AreaChart` showing which trigger was active at each turn (X) vs resistance score at that turn (Y). Color-coded areas per trigger type.

**Intensity Analysis:**

A `grid grid-cols-2 gap-4`:
- Bar chart showing trigger effectiveness at each intensity level (1-5)
- Donut chart showing trigger distribution (what % of messages deployed each trigger)

**Narrative Section:**

`"What broke the target's defenses"` (or `"What kept the target from complying"`) — auto-generated paragraph with specific message quotes (italicized, in quotation marks) and analysis.

---

### Tab 4: Policy Gaps

**Summary:** `"N policy gaps identified"` + severity breakdown badges at top.

**Gap Cards** — one card per gap:

`bg-[#111827] border border-[#2D3748] rounded-xl p-5 mb-4`

Top row: gap title in `text-base font-semibold text-white` + severity badge (Critical/High/Medium/Low)

Gap class label: `"Missing Policy"` / `"Unknown Policy"` / `"Unenforced Policy"` / `"Tooling Gap"` / `"Escalation Gap"` — as a small text badge in `bg-slate-700 text-slate-300`

**Evidence section:** blockquote style — `border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-500/5 rounded-r-lg`
- Quoted text from the target's actual message (what they said that revealed the gap)
- `"— [Target Name], Turn N"` attribution in `text-xs text-slate-400`

Description paragraph: `text-sm text-slate-300`

**Recommendation box:** `bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-3`
- `"Recommendation:"` label in `text-xs text-green-400 font-semibold uppercase tracking-wider`
- Recommendation text in `text-sm text-slate-200`
- Estimated effort: `text-xs text-slate-400` — `"Implementation effort: Low · Est. 7 days"`

**Status row:** `flex items-center gap-3 mt-4`
- Status `Select`: Open / Acknowledged / Remediation Planned / Remediated / Verified by Retest
- Assigned to `Input` placeholder `"Assign owner..."`
- Due date `Input` type `date`
- `"Save"` button size `sm`

---

### Tab 5: Coaching

**"What [Target Name] Did Well" section:**

`bg-green-500/10 border border-green-500/20 rounded-xl p-5`

Unordered list of defensive behaviors observed, each with `CheckCircle2` icon:
- Each item: behavior title in `text-sm font-semibold text-white` + explanation in `text-sm text-slate-300`

**"Areas for Improvement" section:**

`bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mt-4`

Unordered list with `AlertCircle` amber icon:
- Each item: area title + specific suggestion + link to training resource (if configured)

**Recommended Training Modules:**

`grid grid-cols-1 md:grid-cols-2 gap-3 mt-4`

Each module card:
- `bg-[#111827] border border-[#2D3748] rounded-xl p-4`
- Module name in `text-sm font-semibold`
- Short description
- `"Access Training"` link (external, opens in new tab)

**Debrief Template Button:**

`"Generate Debrief Message"` `Button` variant `outline` with `FileText` icon → opens a `Dialog` containing the pre-filled debrief message (in the target's language, auto-generated), with a `"Copy to Clipboard"` button.

---

### Tab 6: Comparisons

**"[Target Name] vs. Their Department" section:**

Recharts `RadarChart` comparing the target's resilience across 5 dimensions (Verification Behavior, Trigger Resistance, Platform Awareness, Response Speed, Report Rate) vs. department average.

**Percentile Section:**

`grid grid-cols-3 gap-4`

Each card:
- Entity label: `"Individual"` / `"Department"` / `"Company"`
- Resilience score in `text-3xl font-black` (colored by level)
- Percentile: `"You rank in the top X%"` or `"Department ranks Nth in the company"`
- Trend arrow vs. last campaign

**Industry Benchmark (if org has opted in):**

`bg-[#111827] border border-blue-500/20 rounded-xl p-5`

`"Industry Benchmark"` label in `text-xs text-blue-400 uppercase tracking-wider`

Bar chart comparing org vs. anonymized industry median across key metrics.

`text-xs text-slate-500 mt-2` — `"Based on opt-in data from N organizations in the financial services sector. All data is k-anonymized."`

---

## PAGE 8: Target Management (`/targets`)

**Purpose:** Manage the pool of employees who can be targeted across campaigns.

**Page header:** `"Targets"` + `"Add Targets"` button (right)

**Filter bar:** Search by name/email, filter by department, filter by consent status (All / On File / Missing / Exempted)

**Targets Table:**

Columns:
- **Employee** — avatar initials + full name + email in small text
- **Department** — text
- **Role** — text
- **Consent** — badge: `"On File"` (green) / `"Missing"` (red) / `"Exempted"` (purple) / `"Expired"` (amber)
- **Campaigns** — count of campaigns this target has been in; clicking opens a `Popover` listing them
- **Resilience** — mini colored bar showing cumulative resilience score (gray if no campaigns yet)
- **Exemptions** — `ExemptionBadge` if any exemption applies: small badge with exemption type (Medical, Occupational, Legal, Temporary)
- **Last Targeted** — date or `"Never"`
- **Actions** — dropdown: "View Profile", "Edit", "Upload Consent", "Add Exemption", "Remove Target"

### Target Addition Options

When `"Add Targets"` is clicked, opens a `Dialog` with two tabs:

**Tab 1: Manual Entry** — same form as wizard Step 2 but standalone

**Tab 2: CSV Import** — drag-and-drop CSV upload with column mapping UI:
- After file is parsed, show a table preview
- Column mapping row: `Select` for each column header to map to the data model fields
- `"Import N targets"` button

---

## PAGE 9: Target Profile (`/targets/:id`)

**Purpose:** Detailed profile of one employee including cross-campaign history and resilience trend.

**Page header:**

`flex items-center gap-4`

- Large avatar circle `w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white`
- Target name in `text-3xl font-black text-white` + department + role in `text-sm text-slate-400`
- Right: consent badge + exemption badge

`flex gap-3 mt-3`:
- `"Edit Profile"` outline button
- `"Upload Consent"` outline button
- `"Add Exemption"` outline button
- `"Remove from System"` destructive button (only if no active campaigns)

### Sections:

**Section 1: Resilience Overview**

`grid grid-cols-3 gap-4`:
- Cumulative Resilience Score — large gauge
- Total Campaigns — count
- Defense Rate — percentage (defended / total campaigns)

**Section 2: Campaign History Table**

Table columns: Campaign Name, Date, Tier, Outcome (badge), Resilience Score, Defense Mechanism, AAR link

**Section 3: Vulnerability Profile**

Auto-generated from campaign history:

`"Most effective trigger against this target:"` — shows the trigger that has worked best, as a large badge in its color

`"Vulnerability trajectory:"` — recharts `LineChart` of resilience scores across campaigns over time

`"Trigger susceptibility chart"` — recharts `BarChart` horizontal showing effectiveness of each trigger when used against this target

**Section 4: Consent & Compliance**

Consent form history: table with columns — Form Version, Signed Date, Expiry, Status (Active / Expired), View PDF link

Exemptions section: list of any active exemptions with type, reason, approved by, approved date, expiry

**Section 5: Psychological Profile**

`bg-[#111827] border border-purple-500/20 rounded-xl p-5`

`text-xs text-purple-400 uppercase tracking-wider mb-3` — `"Behavioral Intelligence"`

Auto-generated behavioral profile in prose + key labels:
- Dominant vulnerability: `"Authority Deference"`
- Decision speed: `"Fast responder (avg 45s)" `
- Verification behavior: `"Occasionally verifies out-of-band"`
- Platform trust: `"High WhatsApp trust, low email skepticism"`

Note at bottom: `text-xs text-slate-500` — `"Profile derived from N campaign engagements. Access restricted to authorized security staff."`

---

## PAGE 10: Persona Library (`/personas`)

**Purpose:** Browse and manage attack personas available to the organization.

**Page header:** `"Persona Library"` + `"Custom Persona"` button (only for orgs with that feature enabled)

**Grid of persona cards** — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`:

Each **Persona Card:**

```
bg-[#111827] border border-[#2D3748] rounded-xl p-5 hover:border-blue-500/30 transition-colors
```

Top: synthetic avatar (colored circle with initial, or abstract pattern) + persona name + persona ID badge (`P-01` etc.)

Role/org line: `text-sm text-slate-400`

Authority level: `●●●○○` dots in cyan, with label like `"Authority: 3/5"`

Channels row: platform icons for this persona's compatible channels

Trigger pairings: small labeled badges `"Authority + Urgency"`

Best for: `text-xs text-slate-400` — `"Finance, Operations, non-technical staff"`

`"View Details"` button → `/personas/:id`

`"Use in Campaign"` button → navigates to `/campaigns/new` with this persona pre-selected

### Persona Detail Page (`/personas/:id`)

Shows full persona specification:
- Full background story / identity cover
- Communication style breakdown (formality level slider, emoji policy, jargon domain)
- Plausible props list (what documents/media this persona can legitimately send)
- Escalation target (which persona it hands off to when escalating)
- Sample messages (3-5 examples shown in chat bubble format) — labeled by trigger type
- Forbidden claims (what this persona should never assert)
- Historical effectiveness stats: use count + average compromise rate + best performing trigger + best performing department

---

## PAGE 11: Analytics Hub (`/analytics`)

**Purpose:** Aggregate insights across all campaigns.

**Page header:** `"Analytics"` + date range picker (last 30 days default)

`"Last updated: [timestamp]"` in `text-xs text-slate-400`

### Section 11.1: Org-Level KPI Row

`grid grid-cols-2 lg:grid-cols-4 gap-4`

- Human Risk Score — large gauge with trend
- Total Engagements — count
- Overall Compromise Rate — percentage + trend
- Policy Gaps Resolved — count

### Section 11.2: Department Risk Matrix

`bg-[#111827] border border-[#2D3748] rounded-xl p-5`

A recharts `BarChart` (grouped bars) showing per-department:
- Average resilience (green bar)
- Compromise rate (red bar)

Departments on X-axis. Clicking a bar filters the page to that department.

Below chart: table showing same data with sortable columns.

### Section 11.3: Two-Column Row

**Left: Trigger Effectiveness Heatmap**

`bg-[#111827] border border-[#2D3748] rounded-xl p-5`

A grid table (departments as rows, triggers as columns) where each cell shows effectiveness as a colored square — dark green (ineffective) to bright red (highly effective). Hovering shows exact percentage tooltip.

**Right: Time-to-Compromise Distribution**

`bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Recharts `AreaChart` showing distribution of time-to-compromise across all compromised engagements. X = minutes, Y = count. Dashed vertical lines at key thresholds (5m, 15m, 30m, 60m).

`"50% of compromised targets fell within [N] minutes"` stat below chart.

### Section 11.4: Platform Performance

`grid grid-cols-2 lg:grid-cols-3 gap-4`

One card per platform — recharts `LineChart` showing compromise rate trend over time for that platform.

### Section 11.5: Vulnerability Trajectory

Full-width recharts `LineChart` — X = campaign date, Y = org human risk score. Shows improvement (or regression) over time. Reference line showing industry average (if benchmark data available).

---

## PAGE 12: Threat Pattern Intelligence (`/analytics/threats`)

**Purpose:** Aggregated threat intelligence derived from all campaigns. Shows attack patterns that consistently work.

**Page header:** `"Threat Pattern Intelligence"` + info tooltip explaining the data source and anonymization

### Sections:

**Effective Pattern Ranking Table:**

sortable shadcn/ui `Table` with columns:
- Pattern ID
- Attack chain
- Target department
- Trigger pairing
- Compromise rate
- Sample size
- Status (Observed / Confirmed / Published / Stale) — badge

**Pattern Detail Panel (slide-out):**

Clicking a pattern row opens a slide-out `Sheet` (shadcn/ui) from the right showing full pattern details:
- Description
- Attack chain diagram
- Evidence stats
- Which organizations it's been confirmed in (anonymized as `"Org A"`, `"Org B"`)
- Recommended defense countermeasures

**Emerging Patterns Feed:**

`bg-amber-500/10 border border-amber-500/30 rounded-xl p-5`

List of patterns flagged as newly observed but not yet confirmed — each with `"Newly observed"` badge and `"Mark as confirmed"` action.

**Cross-Tenant Benchmark (if opted in):**

Industry comparison charts with prominent privacy notice:
`"Showing anonymized aggregate data. Minimum 10 organizations per data point (k-anonymity). No individual or conversation data is shared."` in `text-xs text-slate-400`

---

## PAGE 13: Consent Management (`/consent`)

**Purpose:** Manage organizational and employee consent records.

**Two-tab layout:**

`"Organizational Attestation"` tab | `"Employee Consents"` tab

### Tab 1: Organizational Attestation

If current attestation is valid:
- `bg-green-500/10 border border-green-500/30 rounded-xl p-5`
- `CheckCircle2` icon + `"Current attestation is valid"` + attested by + date + expiry
- `"Download PDF"` link + `"Re-attest"` button (for renewal)

If expired or missing: amber/red banner with `"Attest Now"` button → `/consent/new`

Below: attestation history table (version, date, attested by, status)

### Tab 2: Employee Consents

Filter bar: search, filter by consent status, filter by department

Table columns: Target name, Department, Consent Version, Signed Date, Expiry, Status, View PDF, Re-Request

**Bulk Actions row:** `Select all` checkbox + `"Send re-consent request"` button (sends email to selected targets with new consent form link) + `"Export CSV"` button

**Consent Statistics:**
- `"N / M employees have active consent (N%)"` progress bar
- `"N missing consent"` warning if any
- `"N consents expiring within 30 days"` amber warning if any

---

## PAGE 14: Create Consent Form (`/consent/new`)

**Purpose:** Generate a consent form (organizational or individual employee).

**Form type selector** at top: two large radio cards — `"Organizational Attestation"` / `"Employee Consent Form"`

**Form fields (Employee Consent):**

- Target name and email (pre-filled if `?target=ID` is in URL)
- Form template version `Select` (latest version pre-selected)
- Campaign scope `Select` (which campaign this consent applies to, or "General / All Campaigns")
- Platforms covered (checkboxes for each platform)
- Custom notes field (optional org-specific additions)

**Preview panel:**

Right side (or below on mobile) — a live preview of the generated consent form as it would appear to the employee. The preview renders the template with the filled-in values. Rendered in a `border border-[#2D3748] rounded-xl p-6 bg-[#111827] font-mono text-sm text-slate-300` block to look like a formal document.

**Action buttons:**
- `"Preview Full Document"` — opens a `Dialog` with full-page preview
- `"Download PDF"` — generates and downloads
- `"Send to Employee"` — sends via email with a signing link
- `"Mark as Manually Signed"` — for physical signatures, allows upload of scanned PDF

---

## PAGE 15: Audit Log Viewer (`/audit`)

**Purpose:** Immutable audit trail browser. Used for compliance reviews, incident investigation, and proof of operation.

**Page header:** `"Audit Log"` + integrity status badge: `"Chain Integrity: Verified"` (green) or `"⚠ Integrity Check Failed"` (red, very rare)

**Filter bar:** campaign filter `Select`, event type filter `Select` (multi-select), date range pickers, actor filter `Input`, keyword search

**Integrity Verification Button:** `"Verify Chain Integrity"` `Button` variant `outline` with `Shield` icon — triggers a background job and shows result as a toast notification.

**Export Button:** `"Export Audit Log"` `Button` — opens a `Dialog` for format selection (JSON / CSV) and date range

**Audit Log Table:**

Dense table, monospace styling for key fields. Columns:
- Timestamp — `text-xs font-mono text-slate-300`
- Event Type — badge in event-specific color
- Actor — `"admin:[email]"` or `"system:[module]"` in `text-xs font-mono`
- Campaign — link if applicable
- Target — name if applicable
- Summary — brief description in `text-sm text-slate-300`
- Hash — first 8 chars of entry hash in `text-xs font-mono text-slate-500` with `Copy` icon
- `"Details"` button → opens `Dialog` with full JSON event payload (prettily formatted, syntax-highlighted)

Rows alternate between `bg-transparent` and `bg-white/[0.02]` for readability.

**Pagination:** page-based, 50 rows per page by default with `Select` to change to 25/50/100.

---

## PAGE 16: Organization Settings (`/settings`)

**Purpose:** Configure the organization's PhishYou account.

**Left nav within settings** — vertical list of settings sections:

```
General
Compliance & Legal
Team & Roles
Platform Integrations
Notification Preferences
Billing & Usage
```

### Settings: General

- Organization name `Input`
- Organization domain `Input` (read-only)
- Default tier `Select`
- Default language `Select`
- Debrief reminder window: number `Input` + "hours after campaign end" label
- `"Save Changes"` `Button`

### Settings: Compliance & Legal (`/settings/compliance`)

- Data retention policy per data type (table of data types with `Select` for retention period per row)
- DPA upload (drag-and-drop for Data Processing Agreement PDF)
- Legal review document upload
- `"Download Compliance Package"` — exports all compliance documents as ZIP
- Jurisdiction settings: checkboxes for applicable regulations (GDPR, CCPA, HIPAA, PIPEDA, PDPA-SG)
- Pakistan-specific note section (visible if Pakistani targets or Roman Urdu language is used)

### Settings: Team & Roles (`/settings/team`)

Table of team members with columns: Name, Email, Role, Last Login, Actions (Edit Role, Remove)

Role options: CISO, Security Manager, Security Analyst, HR/Debrief Officer, Auditor (read-only)

Permissions matrix shown below table — a grid showing what each role can do (view, create, halt, export, access PII, access audit, etc.) with `✓` / `—` cells.

`"Invite Team Member"` `Button` → opens `Dialog` with email input + role `Select` + `"Send Invite"` button.

### Settings: Platform Integrations (`/settings/integrations`)

**Twilio Integration:**

`bg-[#111827] border border-[#2D3748] rounded-xl p-5`

Connection status badge + `"Connected"` or `"Not configured"`

Fields: Account SID `Input` (masked), Auth Token `Input` (masked, type `password`)

Phone numbers section: table of provisioned numbers with channel assignment (WhatsApp / SMS / Voice) and `"Add Number"` + `"Release Number"` actions.

Template registration: list of approved WhatsApp templates with status.

**SMTP Configuration:**

Similar card for email SMTP settings: SMTP host, port, username, password (masked), from domain.

Verified domains table: domain + SPF status + DKIM status + `"Verify"` button.

**Alibaba Cloud (Qwen API):**

API key field (masked), model selection (Qwen-Max / Qwen-Plus / Qwen-Turbo), endpoint configuration, token budget alert threshold.

**LinkedIn / Instagram:**

OAuth connection flow — `"Connect LinkedIn Account"` button that initiates the OAuth flow in a popup window. Shows connected accounts as a list with persona assignment.

### Settings: Notification Preferences

`grid grid-cols-1 gap-4`

Each notification type as a row:
- Label + description of the notification
- `Switch` toggle for in-app notification
- `Switch` toggle for email notification
- Threshold `Input` where applicable (e.g., "Alert when harm score exceeds: 0.5")

Notification types:
- Harm signal detected
- Campaign compromised a target
- Target blocked sender
- Campaign completed
- Debrief overdue
- Consent expiring (with days-before threshold)
- Audit chain integrity failure
- Tier A campaign activity
- Policy gap opened/closed

---

## PAGE 17: Help & Documentation (`/help`)

**Purpose:** Inline help, walkthrough guides, and links to external docs.

**Layout:** two-column — left sidebar with topic navigation, right main content area.

**Left sidebar topics:**

```
Getting Started
  - Quick Start Guide
  - Creating Your First Campaign
  - Understanding Tiers

Campaigns
  - Campaign Configuration
  - Live Monitoring Guide
  - Halting Campaigns

Reports & Analytics
  - Reading the AAR
  - Policy Gap Analysis
  - Benchmark Data

Consent & Compliance
  - Consent Framework
  - GDPR Compliance
  - Regional Requirements

Integrations
  - Twilio Setup
  - Email Domain Verification
  - Social Media Accounts

Security & Privacy
  - Data Retention
  - Audit Logs
  - Data Subject Rights
```

**Right content area:**

Markdown-rendered content with proper heading hierarchy, code blocks, callout boxes:

Info callouts: `bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg px-4 py-3 my-4`

Warning callouts: `bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg px-4 py-3 my-4`

Danger callouts: `bg-red-500/10 border-l-4 border-red-500 rounded-r-lg px-4 py-3 my-4`

**Search:** `Input` with `Search` icon at top of help page that filters topics in real-time.

**"Need more help?" section** at bottom: link to external documentation site + support contact email.

---

## Global Components & Micro-Interactions

### Toast Notifications

shadcn/ui `Toaster` component placed at root level. Toast variants:
- Success: left border `border-l-4 border-green-500` + `CheckCircle2` icon
- Error: left border `border-l-4 border-red-500` + `XCircle` icon
- Warning: left border `border-l-4 border-amber-500` + `AlertTriangle` icon
- Info: left border `border-l-4 border-blue-500` + `Info` icon

All toasts: `bg-[#1C2333] border border-[#2D3748]` background, `text-sm text-white` title, `text-xs text-slate-400` description, auto-dismiss after 5 seconds (except errors which persist until dismissed).

### Loading States

- Page-level loading: full-page centered `Loader2` icon in `text-cyan-400 animate-spin w-8 h-8`
- Table loading: 5 skeleton rows using `animate-pulse bg-slate-700 rounded` placeholder bars
- Card loading: skeleton card with pulsing placeholder shapes matching the card layout
- Button loading: button text replaced with `Loader2` spinner, button disabled, width maintained

### Empty States

Consistent empty state design:
- Centered content in the empty area
- Relevant lucide icon `w-12 h-12 text-slate-600`
- `"No [items] yet"` heading in `text-lg font-semibold text-slate-400`
- Descriptive sentence in `text-sm text-slate-500`
- CTA button if appropriate (e.g., `"Create your first campaign"`)

### Error States

Page-level error (API failure):
- `bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center`
- `XCircle` icon red
- `"Something went wrong"` heading
- Error message in `text-sm text-slate-300`
- `"Try again"` button that retries the last request
- `"Contact support"` ghost link

### Confirmation Dialogs

All destructive actions use shadcn/ui `AlertDialog`:
- Title: describes the action (e.g., `"Halt this campaign?"`)
- Description: explains consequences (e.g., `"This will immediately stop all active engagements. The campaign cannot be resumed — only a new campaign can be created."`)
- Cancel button (default focus)
- Confirm button: variant `destructive` (red)

### Keyboard Shortcuts

Global shortcuts (implemented with `useEffect` + `addEventListener`):
- `Cmd/Ctrl + K` — opens a command palette `Dialog` for quick navigation
- `Cmd/Ctrl + N` — navigates to `/campaigns/new`
- `Escape` — closes any open modal/dialog/sheet

### Responsive Breakpoints

- Mobile (`< 768px`): single column layout, sidebar hidden (hamburger menu), bottom nav bar shown
- Tablet (`768px–1024px`): sidebar collapsed to icon-only, content adapts to 2-column
- Desktop (`> 1024px`): full sidebar, multi-column layouts as specified

---

## Security UI Considerations

1. **Session expiry warning:** 2 minutes before JWT expiry, a non-intrusive toast appears: `"Your session expires in 2 minutes. Click to extend."` with an `"Extend Session"` button.

2. **Sensitive data masking:** Phone numbers, emails, and API keys shown in tables are partially masked by default (`alice.j@company.com` → `a***@company.com`), with a `Eye` icon button to reveal (which is itself audit-logged).

3. **PII access gate:** Pages or sections that display full PII check the user's role before rendering. If insufficient permissions: the section shows `"Access Restricted. Your role (Security Analyst) cannot view individual PII. Contact your CISO to request access."` — no data leaks, not even in loading state.

4. **Audit on sensitive actions:** Any time a user views the full conversation thread, exports data, or accesses the audit log, the frontend displays `"This access is logged"` as a `text-xs text-amber-400` reminder below the component.

5. **No credentials in UI:** API keys, tokens, and secrets are always rendered as masked inputs with copy-to-clipboard. They are never displayed in plaintext in the UI.

---

## Design System Implementation Guide

### For AI Coding Agents: Tailwind Configuration & CSS Variables

When implementing this design system, your Tailwind config must extend with these custom colors, utilities, and animations:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bg': {
          'base': '#0F1219',
          'surface': '#15191F',
          'elevated': '#1D232D',
          'subtle': '#232D39',
          'accent': '#1A1F28',
        },
        'text': {
          'primary': '#F5F7FB',
          'secondary': '#A8B4C4',
          'tertiary': '#7A8595',
          'muted': '#5A6470',
          'inverse': '#0F1219',
        },
        'accent': {
          'primary': '#2FD9C7',
          'primary-dark': '#1FA89D',
          'primary-light': '#4FE5D3',
          'success': '#06D369',
          'warning': '#F59E0B',
          'danger': '#FF4757',
          'info': '#5B9EFF',
          'neutral': '#8B95A8',
          'insight': '#A78BFA',
        },
        'border': {
          'subtle': '#252D38',
          'DEFAULT': '#2D3748',
          'light': '#3D4860',
          'active': '#2FD9C7',
          'error': '#FF4757',
        },
      },
      
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        'glow-teal': '0 0 20px rgba(47, 217, 199, 0.2)',
        'glow-danger': '0 0 20px rgba(255, 71, 87, 0.2)',
      },
      
      backgroundImage: {
        'gradient-primary-cta': 'linear-gradient(135deg, #2FD9C7 0%, #06D369 100%)',
        'gradient-danger': 'linear-gradient(135deg, #FF4757 0%, #FB3E5C 100%)',
        'gradient-premium-glow': 'radial-gradient(circle at center, rgba(47, 217, 199, 0.12) 0%, transparent 70%)',
        'gradient-shimmer': 'linear-gradient(90deg, var(--color-bg-subtle) 0%, var(--color-bg-surface) 50%, var(--color-bg-subtle) 100%)',
      },
      
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-danger': 'pulseGlowDanger 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'slide-out-right': 'slideOutRight 300ms ease-out',
        'fade-in-up': 'fadeInUp 400ms ease-out',
      },
      
      keyframes: {
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(20px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 20px rgba(47, 217, 199, 0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 30px rgba(47, 217, 199, 0.4)' },
        },
        pulseGlowDanger: {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 20px rgba(255, 71, 87, 0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 30px rgba(255, 71, 87, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      
      fontSize: {
        'display': ['36px', { lineHeight: '1.25', fontWeight: '800', letterSpacing: '-0.02em' }],
        'section': ['24px', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.01em' }],
      },
    },
  },
  
  plugins: [
    // Add plugin for reduced motion
    function({ addVariant, matchVariant }) {
      addVariant('motion-safe', '@media (prefers-reduced-motion: no-preference)');
      addVariant('motion-reduce', '@media (prefers-reduced-motion: reduce)');
    },
  ],
};
```

### CSS Overlay & Utility Classes

Add these as global CSS utilities (in your main stylesheet):

```css
:root {
  --overlay-hover: rgba(47, 217, 199, 0.08);
  --overlay-focus: rgba(47, 217, 199, 0.12);
  --overlay-selected: rgba(47, 217, 199, 0.15);
  --overlay-success: rgba(6, 211, 105, 0.1);
  --overlay-danger: rgba(255, 71, 87, 0.1);
  --overlay-muted: rgba(0, 0, 0, 0.4);
}

/* Glassmorphism backdrop card (optional premium element) */
.glass-card {
  background: rgba(21, 25, 31, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(45, 55, 72, 0.5);
  border-radius: 12px;
}

/* Subtle gradient text (for premium headings) */
.gradient-text-primary {
  background: linear-gradient(135deg, #2FD9C7 0%, #06D369 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Focus ring utility */
@layer utilities {
  .ring-accent-primary {
    @apply ring-2 ring-offset-0 ring-accent-primary;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### No Plugins or Compiler Needed

This design system uses **only Tailwind core classes**—no custom plugins required. All custom colors, animations, and effects are added via `tailwind.config.js` extended theme. This means:

- ✅ Works in any Tailwind setup (no `tailwindcss-cli` compiler changes)
- ✅ Full support in shadcn/ui components (all use core classes)
- ✅ Zero build-time complexity
- ✅ Drop-in compatible with existing Tailwind projects

---

## Assignment Guide for Team Development

The following groupings are suggested for parallel team development. Each developer can hand this entire document to their AI coding agent and say: *"Build only the pages listed under my assignment. Refer to the Design System, Shared Layout Components, and Global Components sections for shared elements."*

### Developer A — Core Shell & Authentication
- Design system implementation (CSS variables, Tailwind config, shadcn/ui setup)
- `<AppShell>` component (sidebar, header, mobile nav)
- Page 1: Authentication (`/login`)
- All global components (Toast, Loading states, Empty states, Error states, Confirmation dialogs)
- React Router setup + protected route wrapper
- Auth context (JWT storage in memory, auth state, logout)

### Developer B — Campaign Core
- Page 3: Campaign List (`/campaigns`)
- Page 4: Create Campaign Wizard (`/campaigns/new`) — all 5 steps
- Page 5: Campaign Detail (`/campaigns/:id`)
- Conversation Thread Dialog (shared component used in Pages 5 and 6)

### Developer C — Live Operations & Reporting
- Page 6: Live Campaign Monitor (`/campaigns/:id/live`)
- Page 7: After-Action Report (`/campaigns/:id/aar`) — all 6 tabs
- Real-time polling hook (`useInterval` custom hook)
- Resistance Score Gauge component (the signature circular arc SVG — shared across all pages)

### Developer D — People & Intelligence
- Page 2: Dashboard (`/dashboard`)
- Page 8: Target Management (`/targets`)
- Page 9: Target Profile (`/targets/:id`)
- Page 10: Persona Library (`/personas` + `/personas/:id`)

### Developer E — Analytics & Admin
- Page 11: Analytics Hub (`/analytics`)
- Page 12: Threat Pattern Intelligence (`/analytics/threats`)
- Page 13: Consent Management (`/consent` + `/consent/new`)
- Page 15: Audit Log Viewer (`/audit`)
- Page 16: Organization Settings (`/settings` and all sub-pages)
- Page 17: Help & Documentation (`/help`)

---

---

## Design Philosophy & Principles

These principles guide every visual and interaction decision, especially for developers and AI agents implementing edge cases or custom components not explicitly listed in this spec.

### 1. **Intentionality Over Trend**
Every color, animation, shadow, and spacing decision must have a purpose. No gradients "just because" AI designs use them. No neon accents "for vibrancy." Every choice serves readability, hierarchy, or emotional tone.

### 2. **Sophistication Through Restraint**
The inverse of "more is better." A single well-placed border-left accent on a section header says more than a full background gradient. One perfectly-timed 200ms transition is better than three stacked animations. Whitespace and breathing room are features, not wasted real estate.

### 3. **Warm Over Cold**
Dark UIs often lean into pure blacks and cold blues. This design intentionally uses warm-leaning slate and emerald-teal to feel human, approachable, and premium. Think luxury hotels, high-end SaaS, and contemporary design—not gaming rigs or command centers.

### 4. **Motion Should Serve, Not Distract**
Animations guide attention, provide feedback, and create delight. They should never:
- Auto-loop or repeat unnecessarily
- Distract from content
- Violate `prefers-reduced-motion` settings
- Take longer than 400ms unless there's a reason (e.g., page transitions)

When in doubt, a static interaction is better than a janky animation.

### 5. **Hierarchy Through Contrast, Not Volume**
Text has primary, secondary, tertiary, and muted colors—not ten shades. Buttons have one primary variant. Status colors are curated, not randomized. This creates visual order and makes decisions clear.

### 6. **Accessibility Is Non-Negotiable**
- All interactive elements must be keyboard-accessible
- Color is never the only indicator (always pair with text or icons)
- Contrast ratios meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- Focus states are visible and clear
- Test with screen readers and keyboard-only navigation

### 7. **Modern, Not Minimal**
Minimalism can be cold. This design is modern—it uses:
- Subtle shadows for depth (not flat design)
- Refined rounded corners (8-12px, not 0 or 50%)
- Generous spacing (breathing room)
- Contemporary typography (Inter, Geist, Sohne)
- Thoughtful color combinations (complementary, not clashing)

### 8. **Data Visualization Should Inform, Not Overwhelm**
Charts and gauges use the accent color system. Don't introduce new colors for viz. Use the five data-series colors (blue, green, amber, red, teal) in that order across all charts for consistency. Animations help users track changes without feeling bombarded.

### 9. **Mobile-First, Desktop-Enhanced**
Layout begins with mobile constraints (single column, stacked). Tablet adds two-column. Desktop adds three-column and side panels. This prevents bloated desktop-only designs.

### 10. **Consistency Across All Pages**
Every page should feel like one cohesive app. The color palette is identical, animations follow the same rules, button behavior is predictable. A user should never wonder, "Is this a different app?"

---

## Quick Reference: When to Use Each Color

| Color | Use Case | Never Use For |
|---|---|---|
| **Accent Primary** (#2FD9C7) | Primary CTAs, active nav links, focus rings, live indicators, success hover states | Backgrounds (too bright), text on text, body content |
| **Accent Success** (#06D369) | Checkmarks, defended outcomes, completion states, positive trends in charts | Error states, warnings, anything negative |
| **Accent Warning** (#F59E0B) | Paused campaigns, Tier B emphasis, warnings, attention-needed alerts | Success states, primary CTAs, body text |
| **Accent Danger** (#FF4757) | Compromised targets, Tier A emphasis, error borders, destructive buttons | Success states, general backgrounds |
| **Accent Info** (#5B9EFF) | Informational hints, neutral highlights, secondary data in charts | Primary emphasis (use teal instead), danger states |
| **Text Primary** (#F5F7FB) | Headings, main body text, button labels, critical information | Backgrounds, subtle details |
| **Text Secondary** (#A8B4C4) | Labels, descriptions, metadata, secondary information | Headings, primary calls-to-action |
| **Text Muted** (#5A6470) | Placeholders, disabled state text, very subtle hints | Readable body text (too low contrast) |
| **BG Surface** (#15191F) | Card backgrounds, panel backgrounds, normal surfaces | Headers, hero sections (use elevated instead) |
| **BG Elevated** (#1D232D) | Modals, dropdowns, premium surfaces, layered UI | Standard cards (use surface instead) |
| **Border** (#2D3748) | Standard dividers, form input borders, separators | Primary accents (too muted) |
| **Border Active** (#2FD9C7) | Focused input ring, selected states, active indicators | Inactive borders (use standard border instead) |

---

## Common Mistakes to Avoid

1. **Using cyan (#06B6D4) anywhere** — We've migrated to emerald-teal (#2FD9C7). Search and replace globally.
2. **Dark blue text on dark background** — Use white or warm off-white (#F5F7FB) always.
3. **Rounded: rounded-full** — Use `rounded-lg` (8px) or `rounded-xl` (12px). Pill-shaped buttons are dated.
4. **Animations without prefers-reduced-motion support** — Every animation must respect OS-level motion preferences.
5. **Multiple primary buttons** — Only one button per action area should be primary. Others are secondary or ghost.
6. **Backgrounds with low contrast** — Test text on all background colors. Minimum 4.5:1 contrast ratio.
7. **Excessive shadows** — Use `--shadow-xs`, `--shadow-sm`, or `--shadow-md` in most cases. `--shadow-lg` for modals only.
8. **Forgetting button loading states** — Every CTA that triggers an async operation needs a spinner overlay or button-level loading state.
9. **Omitting focus states** — Keyboard users need visible focus rings. Never rely on default browser outlines.
10. **Ignoring typography hierarchy** — Don't use `text-2xl` for body content just to "make it bigger." Use semantic sizes and weights.

---

*Document Version: 2.0 — DESIGN SYSTEM OVERHAUL*
*Last Updated: August 26, 2026*
*Created for: PhishYou — BiSecT (Emerson University) — Alibaba Cloud AI Hackathon 2026*
*Status: COMPLETE — Modern, Sophisticated Design System Ready for Implementation*
*Design Philosophy: Premium enterprise SaaS aesthetic, inspired by Stripe, Linear, Vercel, and contemporary design practices.*
