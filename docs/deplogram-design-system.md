# Deplogram: how the "Your Galley" UI was designed and built

A handover for an agent rebuilding this feel in another codebase. It covers the product app
**Your Galley** (`/dashboard`). The marketing site has its own rules in `docs/design-system.md`,
which predates the app and is partly out of date for it (see §11).

Every value below is copied from the code. Paths are relative to the repo root. Where a choice
was deliberate, the rejected option is named. Where something just happened, it says so.

Stack, for context: Next.js 16 App Router · Tailwind v4 (tokens in CSS, no JS config) · shadcn
on **Base UI** (compose with `render`, not `asChild`) · Hugeicons · Recharts 3.8 · TanStack Query 5 /
Table 9 · React Hook Form + Zod 4 · sonner · next-themes · motion · MSW mocks.

---

## 1. Intent and psychology

### Who is on each surface, and in what state

| Surface | Who | State of mind when they arrive | What the screen must do |
|---|---|---|---|
| Overview `/dashboard` | Developer opening the workspace | Checking in: "is everything OK?" | Answer that in one glance: live count, anything deploying, anything broken. Then let them jump into a project. |
| Project overview | Owner of one app | "How is *this* thing doing, what's live?" | Name, URL, state and the live deployment first; history (the reel) second; numbers third. |
| Deployment detail | Someone who just pushed or redeployed | Waiting, slightly anxious; or a build just failed | Show *where* in the pipeline it is, that it's moving, and the log, without them refreshing. |
| New deployment | Someone shipping something new | Focused, wants it done | One screen, everything editable in place, a single Deploy action. |
| Environment | Someone editing secrets | Careful; afraid of breaking prod | Show exactly what will change before it changes (`+1 added ~1 replaced -1 removed`). |
| Usage & limits | Someone hitting or near a limit | Worried about being cut off | Show used vs limit and say plainly what happens at the limit. No prices (brief: none published). |
| Confirm dialogs | Someone about to do something that matters | Hesitant | Name the action on the button, show what it affects, make irreversible actions harder. |

### The feelings, and the techniques used to produce each

| Feeling | Technique | Where in code |
|---|---|---|
| **Calm** (default) | Monochrome everything. Charts are greys (`--chart-1…5`). Status is a small dot, not a banner. "All quiet — nothing deploying, nothing failing." when nothing needs attention. | `src/components/charts/types.ts`, `galley-overview.tsx` `Attention` |
| **Aliveness / trust that it's real** | Things that are live *move* slightly: sonar ripple on live dots, per-second request bars, map pulses, ticking elapsed timers. Static = settled history. | `status-dot.tsx`, `live-signal.tsx`, `traffic-map.tsx`, `deployment-status.tsx` `useElapsed` |
| **Progress (patience)** | Work in flight is orange and orbiting: comet ring on the dot, a light orbiting the current pipeline card (`beam-border`), light flowing along the cable into it, shimmering "Building…" label. | `status-dot.tsx` `progress`, `globals.css` `beam-border`, `deployment-pipeline.tsx` `Cable` |
| **Urgency (only when earned)** | Red appears only for failure. `CRASHED` gets a heartbeat; failed builds are still (they're history). Limits turn orange at ≥80%, red at ≥100%. | `limitTone()` in `meters.tsx`, `deploymentStatusMeta()` |
| **Confidence** | The one primary action per screen is brushed metal (`metal-brand`), everything else is outline/ghost. Confirm buttons say what they do ("Redeploy", "Delete project"). Rollback gets an Undo toast for 8s. | `button.tsx`, `confirm.tsx`, `notify.ts` |
| **Precision** | Technical values in mono (`font-mono`): SHAs, URLs, commands, env keys, counts. Numbers `tabular-nums`. | everywhere |
| **Warmth (small, deliberate)** | Greeting cycles "Welcome back" → Yoruba "Ẹ káàbọ̀" → Igbo "Nnọọ" → Hausa "Sannu" every 3.5s, with a mono gloss "Yoruba for welcome". The only playful element. Must start in English (user rule). | `galley-overview.tsx` `welcomes` |

---

## 2. Information hierarchy

### How importance is decided

1. **State before content.** Is it live, working or broken? That is the first thing on every
   screen: the status pill next to the title, the `3 live · 1 deploying · 1 needs attention` line
   under the greeting.
2. **The thing you'd act on next.** For example, the "Right now" panel on Overview lists only
   projects that are working or failed. If nothing is, it shows one quiet line.
3. **Identity** (name, URL, commit), then **history**, then **numbers**.

### How importance shows up

| Lever | Rule | Values |
|---|---|---|
| Size | Only the page title is big. Section titles are body-size. | Page `h1`: `text-2xl sm:text-3xl font-medium tracking-tight` (`page.tsx`). Overview greeting & project name: `text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em]`. Section `h2`: `text-sm font-medium` (Overview) or `text-base font-medium` (`PageSection`). |
| Weight | Two weights in the app: 400 and 500; 600 only for the two hero titles above. | — |
| Colour | Foreground = the value; `text-muted-foreground` = the label. Brand orange = "working" or "the action". Red = failed. | `text-muted-foreground` is the default for every label, meta line, axis and timestamp. |
| Mono | Mono means "a machine value you might copy". Not used for prose. | `font-mono text-xs` meta; `text-[0.6875rem]` (11px) for URLs in tiles. |
| Position | Primary action top-right of the page header (`PageHeader actions`). In a form, a sticky bar at the bottom. | `deploy-config.tsx` sticky footer, `project-environment.tsx` `sticky bottom-3` change bar. |
| Spacing | Bigger gaps separate meaning, smaller gaps group. | Page grid `gap-8`; Overview stack `gap-5`; inside a well `gap-3`; label→value `gap-1.5`. |
| Depth | The thing you click is raised (`surface-raised`); the thing you read *into* (input, log, bar track) is sunken. | §3 surfaces |

### How much goes on one screen

- **One primary (metal) action per view.** Written into `button.tsx` as a comment.
- **One accent per view.** In charts: at most one `brand` series.
- **No helper sentence under every field.** Labels and mono values only. A description line is
  allowed on the page header and on empty states.
- **Dense over stacked.** Prefer one table or one master–detail screen to a series of cards that
  each ask one question. (The four-step wizard was rejected for exactly this; see §11.)
- In practice: Overview = greeting + 4 figures + project tiles + map/side column. That is the
  ceiling; anything more goes on its own page ("All activity →").

---

## 3. Design tokens

All in `src/app/globals.css`. App overrides are scoped with `html:has([data-app])` (the app
layout `src/app/(app)/layout.tsx` renders `<div data-app>`), so the marketing site keeps its own
values. The dark theme is the default: `ThemeProvider defaultTheme="dark" enableSystem={false}`
(`src/components/shared/providers.tsx`).

### 3.1 Colour: the depth ladder (neutrals, chroma 0)

All neutrals are achromatic `oklch(L 0 0)`. Deliberate: the earlier olive tint was dropped with
the rebrand (`docs/design-system.md` log, 2026-09-28).

| Layer | Token | Dark | Light | What it is |
|---|---|---|---|---|
| Frame | `--app-frame` (`bg-app-frame`) | `oklch(0.15 0 0)` | `oklch(0.955 0 0)` | Sidebar + header. Also `--sidebar` in the app. |
| Panel | `--app-panel` (`bg-app-panel`) | `oklch(0.225 0 0)` | `oklch(1 0 0)` | The rounded content panel. Lightest large area. |
| Well | `--card` (`bg-card`) | `oklch(0.18 0 0)` | `oklch(0.977 0 0)` | Cards/tables set *into* the panel: darker than the panel, lighter than the frame. |
| Raised | `--surface-raised` | `oklch(0.24 0 0)` | `oklch(1 0 0)` | Tiles, chips, table bodies inside a well. |
| Sunken | `--surface-sunken` | `oklch(0.145 0 0)` | `oklch(0.94 0 0)` | Input troughs, segmented tracks, bar tracks, footers. |
| Floating | `--popover` | `oklch(0.27 0 0)` | `oklch(1 0 0)` | Menus, dialogs, tooltip cards. Lightest of all in dark. |
| Hover/chip | `--muted`, `--accent` | `oklch(0.29 0 0)` | `oklch(0.945 0 0)` | Row hover, skeleton base, icon tiles. Raised in the app so hovers stay visible inside wells. |
| Secondary | `--secondary` | `oklch(0.29 0 0)` | `oklch(0.97 0 0)` | Secondary button fill. |
| Canvas | `--background` | `oklch(0 0 0)` | `oklch(1 0 0)` | Not used for app chrome. Outline buttons use it (`bg-background`). |
| Text | `--foreground` | `oklch(0.985 0 0)` | `oklch(0.145 0 0)` | Values. |
| Label text | `--muted-foreground` | `oklch(0.72 0 0)` | `oklch(0.53 0 0)` | Labels, meta, axes. |
| Hairline | `--border` | `oklch(1 0 0 / 10%)` | `oklch(0.92 0 0)` | Used at `/70`, `/60`, `/50` opacity, never solid. |
| Input edge | `--input` | `oklch(1 0 0 / 14%)` | `oklch(0.9 0 0)` | |

The rule behind the ladder (comment in `globals.css`): *"Raised is lighter, contained is darker."*
**Every element must differ in tone from what it sits on.** This was learned the hard way (§11).

### 3.2 Colour: meaning (chromatic)

| Token | Dark | Light | Allowed to mean | Never |
|---|---|---|---|---|
| `--brand` | `#ff5c35` | `#ff5c35` | The primary action; work in progress; the live/selected marker; a limit ≥80%. | Errors. Large areas. |
| `--brand-ink` | `#ff5c35` | `oklch(0.56 0.19 34.6)` | Brand-coloured *text/strokes* on a surface ("1 deploying", active nav icon). | Fills. |
| `--brand-foreground` | `oklch(0.145 0 0)` | same | Text on a brand fill. Near-black, never white (white is ~3.1:1 on `#ff5c35`). | |
| `--success` | `oklch(0.74 0.16 150)` | `oklch(0.58 0.15 150)` | Live, running, good delta. | Decoration. |
| `--destructive` | `oklch(0.68 0.2 12)` | `oklch(0.58 0.22 12)` | Failed, crashed, limit reached, bad delta, irreversible confirm. | Anything that isn't a problem. Hue 12° (crimson) so it can't be mistaken for the orange brand at ~35°. |
| `--ring` | `= --brand-ink` | `= --brand-ink` | Focus rings (`outline-ring/50` globally). | |

Status → tone mapping lives in one function, `deploymentStatusMeta()`
(`src/features/deployments/components/deployment-status.tsx`):

| State | Label | Tone | Motion |
|---|---|---|---|
| `RUNNING` (current) | Running | success | live |
| `RUNNING` (replaced) | Ready | success | still (+ `dim`) |
| `QUEUED` | Queued | muted | waiting |
| `BUILDING` / `BUILT` / `DEPLOYING` | Building / Built / Deploying | progress (brand) | progress |
| `BUILD_FAILED` / `DEPLOY_FAILED` | Build failed / Deploy failed | danger | still |
| `CRASHED` | Crashed | danger | alert |

Tinted pill recipe (`tonePill`): `bg-success/10 text-success` · `bg-brand/10 text-brand-ink` ·
`bg-destructive/10 text-destructive` · `bg-muted text-muted-foreground`.

### 3.3 Colour: charts

| Token | App dark | App light |
|---|---|---|
| `--chart-1` (hero series) | `oklch(0.93 0 0)` | `oklch(0.3 0 0)` |
| `--chart-2` | `oklch(0.7 0 0)` | `oklch(0.5 0 0)` |
| `--chart-3` | `oklch(0.55 0 0)` | `oklch(0.64 0 0)` |
| `--chart-4` | `oklch(0.43 0 0)` | `oklch(0.76 0 0)` |
| `--chart-5` | `oklch(0.34 0 0)` | `oklch(0.85 0 0)` |

Strongest first, fading toward the background. `brand` is allowed for one series. In
`types.ts`, `chartColor()` returns raw `var(--name)`, because Tailwind only emits `--color-*`
for classes it sees. Inline styles with `--color-chart-1` silently rendered nothing (a bug that
happened, then got fixed).

### 3.4 The metal (the only decorative effect)

`@utility metal-brand` in `globals.css`. It is the brand as brushed metal, made of two background layers:

```
lighting: linear-gradient(180deg, white/.40 0%, white/.12 36%, black/.06 54%, transparent 74%, white/.14 100%)
metal:    linear-gradient(105deg, oklch(.72 .18 45) 0%, oklch(.66 .21 36) 30%, oklch(.8 .14 55) 48%,
                                  oklch(.64 .21 34) 66%, oklch(.71 .19 41) 100%)   size 220% 100%
edges:    inset 0 1px 0 white/.6, inset 0 -1px 0 black/.28, inset 0 0 0 1px rgb(110 30 0 / .35)
hover:    metal layer background-position 0% → 100% over 0.7s cubic-bezier(0.16,1,0.3,1)
```

It's used on exactly these: the primary button (`variant="default"`), the 3px active-nav edge
(`sidebar-nav.tsx`), the 3px edge on the selected repository (`repo-list.tsx`), the 3px top strip
on the live frame in the reel and its legend dot, the navigation progress bar, and the "Free"
plan badge (`workspace-switcher.tsx`). The pattern: it marks **selected / live / the action**.
`metal-brand-text` (same idea as a text gradient) is used for the word
"Live" on the live reel frame.

Why: the project manager reviewed screens and asked for "metallic orange accents". Flat orange
read as generic. **Never paint an area larger than a button with it.**

### 3.5 Type

| Role | Font | Where set |
|---|---|---|
| Everything in the app (UI, headings, buttons, menus, portals) | **Host Grotesk** (`--font-heading`) | `html:has([data-app]) { @apply font-heading }`. On `<html>` so portaled menus inherit it. |
| Machine values | **Geist Mono** (`--font-mono`) | `font-mono` |
| Marketing body only | Inter Tight (`--font-sans`) | not used in the app |

Deliberate: one grotesk throughout the app, not the marketing pairing. Buttons are explicitly
`font-heading tracking-tight`.

App type scale (Tailwind defaults plus a few fixed sizes; the clamp() display sizes in
`@theme` are marketing-only):

| Use | Class |
|---|---|
| Hero title (Overview greeting, project name) | `text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em]` |
| Page title | `text-2xl sm:text-3xl font-medium tracking-tight` |
| Big figure | `text-2xl font-mono tracking-tight tabular-nums` (Overview figures) or `text-2xl font-medium` (`Stat`) |
| Section title | `text-sm font-medium` / `text-base font-medium` |
| Body, rows | `text-sm` |
| Meta, labels, axis | `text-xs` |
| Small mono (URLs in tiles, SHAs in frames) | `text-[0.6875rem]` (11px) |
| Settings inputs | `font-mono text-[0.8125rem]` (13px) |
| Eyebrow (rare in app) | `text-[0.6875rem] font-medium tracking-[0.08em] uppercase` ("LATEST DEPLOYMENT") |

### 3.6 Spacing

Tailwind's 4px scale, no custom tokens. The recurring values:

| Thing | Value |
|---|---|
| Page padding | `px-4 py-6 sm:px-6 sm:py-8 lg:px-8` (`pageContainerClass`) |
| Gap between page sections | `gap-8` (Page) · `gap-5` (Overview) · `gap-4` (grids of wells) |
| Inside a well | `p-4` (`sm:p-5` for stat strips and chart cards) |
| Inside a raised tile | `p-3` / `p-3.5` |
| Label → value | `gap-1` / `gap-1.5` |
| Row height | table cells `py-3`; header `h-10`; settings rows `py-2.5`; inputs `h-8`–`h-9`; buttons `h-9` |

### 3.7 Radius (`--radius: 0.625rem` = 10px)

| Token | Value | Used for |
|---|---|---|
| `rounded-md` | 8px | inputs, settings inputs, menus |
| `rounded-lg` | 10px | icon tiles, segmented options, tooltip card |
| `rounded-xl` | 14px | raised tiles, tables, chart cards, callouts, dialogs, segmented track |
| `rounded-2xl` | 18px | wells on Overview, the content panel's top corners, empty states |
| `rounded-3xl` | 22px | the project Stage only |
| `rounded-full` | pill | buttons, status pills, dots |

This just happened: wells are sometimes `rounded-xl` (`ChartCard`, `DataTable`, `StatGroup`) and
sometimes `rounded-2xl` (Overview sections). There's no rule behind the difference.

### 3.8 Borders, shadows and elevation

- **Borders:** 1px hairlines at reduced opacity: `border-border/70` on wells,
  `/60` on the panel edge, `/50` inside raised things. Never a solid full-strength border.
- **Shadows: inset only.** A standing user rule: *"stop giving shadows… only inner shadows are
  better."* Depth comes from tone steps plus inset highlights:

```
surface-raised:  bg var(--surface-raised); border 1px solid color-mix(foreground 10%);
                 box-shadow inset 0 1px 0 color-mix(foreground 7%)        ← top highlight
surface-sunken:  bg var(--surface-sunken); box-shadow inset 0 1px 2px rgb(0 0 0 / .3)  ← shaded from above
surface-band:    bg color-mix(in oklab, var(--surface-raised), var(--surface-sunken) 55%)  ← label column / header band
bevel (inverted & danger buttons): inset 0 1px 0 white/.45, inset 0 -2px 0 black/.22 + white→black gradient
```

The **one** non-inset shadow that is structural is the panel's corner cap (see §4). The remaining
outer glows are listed honestly in §11.

### 3.9 Surface layering, as a stack

```
frame (0.15)  ─┬─ sidebar, header
               └─ panel (0.225, rounded-t-2xl, border-x border-t /60)
                    └─ well (card 0.18, rounded-xl/2xl, border /70)
                         ├─ raised (0.24, inset top highlight)  ← tiles, chips, table body, selected segment
                         ├─ sunken (0.145, inset shade)         ← inputs, tracks, footers, signal strips
                         └─ band   (mix)                        ← settings label column
floating (popover 0.27, bg-popover/70 + backdrop-blur-2xl for menus)
```

---

## 4. Layout

### Shell (`src/components/app-shell/app-shell.tsx`)

- shadcn `SidebarProvider`. Sidebar `16rem`, icon rail `3rem`, mobile sheet `18rem`; `⌘/Ctrl+B`
  toggles; state persisted in the `sidebar_state` cookie and read **on the server** so the first
  paint has the right width.
- Header: `sticky top-0 z-30 h-14 bg-app-frame`. The breadcrumb is a row of **switchers**
  (workspace with plan badge → project → scope → page), not plain links.
- Content panel: `rounded-t-2xl border-x border-border/60 bg-app-panel`, `md:mr-3.5` (leaves a
  right gutter for the scrollbar).
- **The page scrolls, the frame stays.** A "corner cap" (`sticky top-14 h-4 rounded-t-2xl` with
  `shadow-[0_-16px_0_16px_var(--app-frame)]`) stays pinned under the header and keeps drawing the
  panel's rounded top, so content slides *under* a rounded edge. Copied in spirit from Pxxl. A
  scroll container inside the panel was rejected because it breaks native find, keyboard and
  scroll restoration.
- `PageScrollbar` draws the scrollbar in the frame's right gutter (`fixed top-14 right-0 w-3.5`,
  hidden below `md`). The native scrollbar is hidden in the app.

### Page widths (`src/components/app-shell/page.tsx`)

| `width` | Class | Used by |
|---|---|---|
| `default` | `max-w-6xl` | project settings, activity |
| `narrow` | `max-w-3xl` | account settings, delete account |
| `wide` | `max-w-[96rem]` | Overview, projects, deployments, every project tab, new deployment, usage |
| `full` | `max-w-none` | reserved (logs/CodePad) |

Every page is `<Page><PageHeader title description actions meta back /> …sections</Page>`.
`PageSkeleton` uses the same `pageContainerClass`, so the loading and loaded layouts line up.

### Arrangement patterns

| Pattern | Grid | Where |
|---|---|---|
| Figure strip | one well, cells split by hairlines: `grid-cols-2 lg:grid-cols-4 lg:divide-x` | Overview `Figures`, `StatGroup` |
| Tiles in a well | well `p-3` holding raised tiles, `sm:grid-cols-2 xl:grid-cols-4` | Overview projects |
| Main + side | `lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]` | Overview map / right-now+activity |
| Master–detail | `lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_…]`, master `lg:sticky lg:top-20` | New deployment |
| Hero + aside | `lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end` | Project Stage |
| Two-up charts | `lg:grid-cols-2` (`lg:grid-cols-3` for limits) | Metrics, Usage |
| Cards list | `lg:grid-cols-2 2xl:grid-cols-3` | Projects list (so 2 columns at a 1440px viewport) |
| Horizontal strip | `shrink-0 w-56` frames in a scroll row | Project reel |

### Responsive behaviour

- Breakpoints are Tailwind defaults; "mobile" = `< 768px` (`src/hooks/use-mobile.ts`). The sidebar
  becomes a sheet there.
- Header drops the scope and page crumbs on phones (`max-sm:hidden`) when inside a project.
- Tables: columns declare `hideBelow: "sm" | "md" | "lg" | "xl"` (`data-table/types.ts`). Phones keep
  only the essentials.
- The pipeline turns vertical below `lg` (`max-lg:` cable gradients, `cable-flow-y`).
- `StatGroup`: 1 column → 2 at `min-[480px]` → a row at `lg`.
- `minmax(0,…)` everywhere so long mono strings can't widen a grid track.

---

## 5. Component system

### Folder structure

```
src/components/
  ui/            shadcn primitives on Base UI (button, dialog, dropdown-menu, input, sidebar, skeleton, table…)
  shared/        app-agnostic building blocks: icon, status-dot, segmented, settings-table, logo…
  app-shell/     frame: app-shell, app-header (+ header/ switchers), sidebar-nav, page, page-scrollbar,
                 navigation-progress, app-loader, page-skeleton, empty-state, error-state
  charts/        chart system (index.ts is the public API)
  data-table/    DataTable, toolbar (search + filter chips), URL state
  feedback/      confirm (useConfirm), notify (toasts), callout, error-message
  forms/         Form, FormField, fields, wizard (dev only), env import dialog, unsaved-changes guard, drafts
  log-viewer/    LogViewer + ANSI parser
  command-palette/
src/features/<domain>/      data hooks (<domain>.ts) + components/ for that domain
  overview · projects · deployments · deploy · activity · usage · account · auth · workspace
```

The rule is that `components/` never imports from `features/`. Feature components compose the
blocks. App code never imports `components/marketing`.

### Building blocks and what they're made of

| Block | Built from | Notes |
|---|---|---|
| `Button` (`ui/button.tsx`) | Base UI Button + cva | variants below; `loading` prop = spinner + `aria-busy` + disabled |
| `Icon` (`shared/icon.tsx`) | Hugeicons | sizes `xs 3.5` · `sm 4` · `md 5` · `lg 6`; `strokeWidth 1.5`; `filled` for the active nav |
| `StatusDot` | spans + keyframes | tones × motions (§6) |
| `Segmented` | sunken track + raised selected option | `role="tablist"`; counts as "Live · 3". For views, never navigation. |
| `SettingsTable` / `SettingRow` | `surface-raised` + `surface-band` label column `8.5rem` | borderless mono inputs that show edges on hover, sink on focus (`settingInputClass`) |
| `Skeleton` | `skeleton` utility | `SkeletonText`, `SkeletonAvatar` |
| `Callout` | tone box | `info / success / warning (brand) / danger`; optional `dismissId` remembered in localStorage |
| `EmptyState` / `ErrorState` | icon tile + title + one line + one action | `dashed` or `plain`; `compact` size |
| `Stat`, `Delta`, `StatGroup`, meters, `Sparkline`, `TickGauge`, `Heatmap`, `AreaTimeSeries`, `BarTimeSeries`, `ChartCard` | §7 | |

### Combinations (feature-level)

`DeploymentStatus` (dot or pill + ticking duration) · `DeploymentPipeline` (cards + `Cable`) ·
`LogViewer` · `LiveSignal`/`SignalBars` · `TrafficMap` · `ActivityItem` · `ProjectTile` ·
`Stage` + `Reel` + `Vitals` + `Spec` (project overview) · `RepoList` + `ConfigSettings`
(new deployment) · `DataTable` + toolbar · the confirm dialog.

### Button variants (`ui/button.tsx`)

| Variant | Recipe | Use |
|---|---|---|
| `default` | `metal-brand text-brand-foreground` | **The** forward action on the screen: Deploy, Save & redeploy, Redeploy, New deployment. Max one per view. |
| `outline` | `border-border bg-background hover:bg-muted` (dark: `bg-input/30`) | Secondary next to a primary: Visit, Import .env, Add variable, Try again. |
| `ghost` | transparent, `hover:bg-muted` | Tertiary, Cancel, icon buttons. |
| `inverted` | `bevel bg-foreground text-background` | Marketing and global error pages; rarely in-app. |
| `danger` | `bevel bg-destructive text-white` | Only inside a confirm dialog for irreversible actions, never on a page. |
| `destructive` | `bg-destructive/10 text-destructive` | The page-level button that *opens* a destructive confirm. |
| `link` | `text-brand-ink hover:underline` | Inline links. |

Sizes: `h-6 xs` · `h-8 sm` · `h-9 default` · `h-11 lg` · icon `size-6/8/9/10`. All `rounded-full px-4.5`.

### States

| State | Implementation |
|---|---|
| Hover | Colour/tone shift only: `hover:bg-muted`, `hover:text-foreground`. Tiles lift `hover:-translate-y-0.5` (reel frames `-translate-y-1`), `duration-300 ease-out-expo`. |
| Focus | `focus-visible:ring-3 ring-ring/50` (buttons/inputs); `ring-2 ring-ring/60 ring-inset` on whole-row links. The ring is brand-ink. |
| Active / pressed | Buttons `active:translate-y-px`. Selected segment = `surface-raised`. Active nav = metal edge + filled icon in `text-brand-ink`. |
| Disabled | `disabled:opacity-50 pointer-events-none`. Nav "Soon" items: `aria-disabled` + "Soon" badge. |
| Loading (first) | Skeletons in the real layout's shape. `ChartCard skeletonHeight` matches the chart. Table renders skeleton rows with per-column widths (`column.skeleton`). |
| Loading (refetch) | Old data stays (`keepPreviousData`), table dims to `opacity-60`, a 2px `animate-scan` brand bar runs along the table's top. |
| Loading (action) | Button `loading` spinner; confirm dialog runs the action itself and keeps its spinner until it resolves. |
| Loading (route) | `NavigationProgress`: 2px metal bar, appears only after 150ms, trickles to 90% and never claims "done" early. Nav links show a small spinner (`useLinkStatus`). |
| Loading (app boot) | `AppLoader`: brushed-metal ring + shimmering "Connecting to Your Galley". The only spinner-style full-screen loader. |
| Empty | `EmptyState`: icon tile, short title, one line, one action. Distinguishes "nothing yet" from "nothing matches" (different copy and no CTA). |
| Error | `ErrorState role="alert"`: "This didn't load." + one sentence + "Try again" (outline). In charts: `size="compact"`. Errors are turned into sentences by `errorMessage()`. |

---

## 6. Motion

### Constants

| Name | Value | Where |
|---|---|---|
| `EASE_OUT` / `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | the app's only entrance curve (`src/lib/motion.ts`, `globals.css`) |
| `EASE_IN_OUT` | `[0.65, 0, 0.35, 1]` | loops (marketing) |
| `DURATION` | fast `0.3s` · base `0.5s` · slow `0.6s` | |
| Tailwind entrance | `animate-in fade-in slide-in-from-bottom-1 duration-500 ease-out-expo` | the standard "arrive" in the app |
| Dialog / menu | `duration-100` fade + `zoom-in-95` | shadcn defaults, kept |

### What animates, with exact values

| Element | Animation | Means |
|---|---|---|
| Status dot `live` | two `status-ripple` rings, `2.8s cubic-bezier(0.16,1,0.3,1) infinite`, second at `-1.4s`; scale 1→3.4, opacity .6→0 | serving traffic |
| Status dot `progress` | comet ring `animate-spin 1.1s` + core `status-breathe 1.6s` (scale .8↔1) | working |
| Status dot `waiting` | hollow ring, `status-wait 2.6s` opacity .35↔1 | queued |
| Status dot `alert` | `status-heartbeat 1.8s` (1 → 1.4 → 1.05 → 1.25 → 1) | crashed now |
| Status change | one `status-flash` ring `0.9s` (scale →4.5, fade) when the tone changes after mount, never on first paint | "something just happened" |
| Skeleton | **one** diagonal beam pinned to the viewport (`background-attachment: fixed`, `250vw 100vh`), `skeleton-beam 2.6s cubic-bezier(0.45,0,0.25,1)`; fades in after `0.12s` (`skeleton-in 0.5s`) so fast loads never flash | the page loads as one scene, not fifty shimmers |
| Current pipeline stage | `beam-border`: conic light orbiting the card border, `3.2s linear` | "this one is working" |
| Cable into current stage | dashed brand gradient sliding `cable-flow 0.9s linear` (28px period) | work flowing |
| "Building…" text | `text-shimmer 2.6s linear`, muted → brand → muted | in progress |
| Log lines | new lines `fade-in slide-in-from-bottom-1 duration-300`; blinking block cursor `blink 1.1s steps(2)` | live stream |
| Table rows | `slide-in-from-bottom-1 duration-500`, delay `min(index,12) × 30ms` | data landed |
| Reel frames | `slide-in-from-right-2 duration-500`, delay `index × 45ms` | |
| Greeting word | re-keyed span, `fade-in slide-in-from-bottom-1 duration-500` every `3500ms` | |
| Map waves | canvas; each city with new requests emits a ring through the dot grid: life `2400ms`, band `1.15` map units, strength `0.3 + 0.7·w`, reach `2.5 + 9·w` (w = city's share of the busiest city), red if errors > 15%; staggered `(i × 173) % 1400 ms` so they don't fire in one beat | where traffic is, how much |
| Usage meter | width 0 → value, `duration-1000 ease-out-expo` | |
| Tick meter / dot list | ticks light left→right, `14ms` / `10ms` per tick | |
| Segmented meter | `scaleX` 0→1 `700ms`, `90ms` stagger | |
| Area chart | Recharts `1100ms ease-out`; bars `900ms`, series stagger `120ms` | |
| Tooltip | `animationDuration 180` | |
| Scrollbar | idle faint pill `opacity-35 w-1` → scrolling `w-1.5 opacity-90` → dragging `w-2` brand-lit, `duration-300`; idle after `1100ms` | |
| Nav progress | scaleX 0→0.9 over `8s` `[0.08,0.82,0.17,1]`; exit scaleX→1 `0.15s`, fade `0.25s` | |
| Metal hover | background slides `0.7s` | light moving on metal |

### What never animates

- Layout-affecting properties. Animations use transform, opacity or background-position, plus
  width only on the meter fill.
- Settled history: failed or replaced deployments have a still dot.
- Page titles after their entrance, numbers in tables, and anything on a timer the user didn't start.
- Entrances never replay on re-render: rows and events animate only when they're new (the activity
  feed tracks `seen` ids; the log tracks `fresh` lines).
- There's no count-up on figures in the app (`AnimatedCounter` is marketing-only). Numbers
  appear at their value. This was deliberate: a counting number reads as fake when it's live data.

### Reduced motion

`<MotionConfig reducedMotion="user">` app-wide. Every CSS animation carries
`motion-reduce:animate-none` (or `hidden` for decorative rings). The skeleton beam and `beam-border`
switch off in `@media (prefers-reduced-motion: reduce)`. The map skips waves but still draws city
points. The app loader slows its spin from `1.8s` to `4s` instead of stopping, so it still reads as
"loading". Lenis (smooth scroll) is not in the app at all (§11).

---

## 7. Data and charts

### Chart types and when each is used (`src/components/charts/`)

| Component | When |
|---|---|
| `AreaTimeSeries` | Continuous values over time (requests, latency). First series is the hero (1.75px solid line, fill .32→0); others are "previous period" style (1.25px, dashed `4 4`, fill .12). Lines and fills fade at both edges (8% mask). |
| `BarTimeSeries` | Counts per period (builds/day, bandwidth). Optional `stacked`. Rounded tops `[4,4,1,1]`, bars fade .95→.35 to base, `maxBarSize 28`. |
| `Sparkline` | Shape only, inside a stat tile. No axes, no tooltip. HTML end-dot. |
| `UsageMeter` | A plan limit: `h-1.5` bar, coloured by `limitTone()`. |
| `TickMeter` | A share ("78% paid"), 56 thin ticks with a taller marker. |
| `SegmentedMeter` | A whole split into parts (storage by type). Labels under 8% are dropped but stay in the legend. |
| `DotProgressList` | Ranked rows (top sources), dots relative to the max row. |
| `TickGauge` | One headline ratio, radial ticks, 260° sweep. |
| `Heatmap` | Weekday × hour intensity, 5 levels `[0.06, 0.16, 0.3, 0.5, 0.78]`; busiest cell outlined; hover value in a readout above. |
| `SignalBars` (projects) | Live per-second request bars for the last 60s; newest bar brand-lit, errors cap red, scan line at "now". |
| `TrafficMap` (overview) | Live geography, canvas dot map from `dotted-map` generated on the server. |

### Colours, labels and tooltips

- Monochrome greys by default; brand for at most one series ("the thing that matters now").
  Success/destructive appear only in `Delta` and error caps.
- Grid: horizontal only, `strokeDasharray="2 4"`, `stroke-border`. No axis lines, no tick lines.
- Y axis: width `52`, `tickCount 5`, `formatCompact`.
- X axis: `minTickGap 28`, `Oct 3` short dates (UTC). **The hovered x value becomes a solid pill on
  the axis** (`ActiveAxisPill`), and nearby tick labels fade out (`AxisTick`, within 60px) so they
  don't collide. This is the signature chart interaction.
- Tooltip card: `rounded-lg border-border/70 bg-popover/95 backdrop-blur-md text-xs`, long date
  ("Fri, Oct 3") header, a row per series with a colour dot, value right-aligned `tabular-nums`. No
  shadow.
- Legend: dots in a row **above** the chart next to the headline number (`ChartLegend`), not under it.

### Number formatting (`src/lib/format.ts`)

| Function | Example | Use |
|---|---|---|
| `formatCompact` | 4120 → `4.1K` | axes, figures, tight spaces |
| `formatNumber` | 18420 → `18,420` | exact counts |
| `formatBytes` | 8_400_000_000 → `8.4 GB` (decimal units, as plans are written) | storage, bandwidth |
| `formatPercent` | 0.0731 → `7.3%` | rates, deltas |
| `formatDuration` | 74 → `1m 14s` | build times |
| `formatRelativeTime` | `just now` · `5m ago` · `3h ago` · `yesterday` · `4d ago`, then `24 Sep 2026` | timestamps (exact time on hover in activity) |
| `formatDate` | `24 Sep 2026`, UTC | so server and client render the same |

Units are smaller and muted next to the value: `212 / 300`, `8.4 GB / 10 GB`, `3 of 5 live`.

### How a chart ties to its surroundings

`ChartCard` = small muted title (+ icon) top-left, an action top-right (range `Segmented`), then the
**headline number with its `Delta`** above the chart, then the legend, then the chart. The number
tells you the answer; the chart shows the shape. `Delta` colours by meaning, not direction: pass
`inverse` for metrics where down is good (errors, build time).

---

## 8. Interaction patterns

| Pattern | How it works here |
|---|---|
| **Navigation** | Sidebar groups (Overview / Projects / Deployments / Activity · Build: CodePad, Storage · Toolkit · Manage) with "Soon" items disabled. Inside a project, the sidebar swaps to the project's tabs with "‹ All projects". Breadcrumb crumbs are switchers (dropdowns of siblings). |
| **Search** | `⌘K`/`Ctrl+K` or `/` opens the command palette (`cmdk`): projects, pages, actions; prefixes `>` actions and `@` projects narrow it (shown as a chip; Backspace on empty input leaves the filter); nested pages ("Switch project…"); recents; pages can contribute commands. List search debounces `300ms`. |
| **Filters** | `Segmented` with counts for one-dimensional views (All · 3 / Live · 3 / Deploying · 1 / Failed · 1). For tables: "Add filter" menu → chips like `Status  Failed, Crashed ×`. **All list state lives in the URL** (`q`, one param per filter, `sort=-created`, `page`), so views can be shared and survive a refresh; any change except paging resets to page 1. |
| **Tables** | `DataTable`: server-driven sort and pagination ("21–40 of 46"); the whole row is a link (an absolutely-positioned `<Link>` under interactive cells, with an aria-label), plus a `⋯` row menu (Visit, View build logs, Copy commit SHA, Redeploy, Roll back to this). Secondary columns hide by breakpoint. |
| **Detail views** | **Pages, not sheets.** A deployment, a project and each project tab are their own URLs (`/dashboard/projects/[id]/deployments/[deploymentId]`). Dialogs are only for confirmations and the `.env` import. Master–detail on one page for New deployment (the selected repo goes in `?repo=`). |
| **Forms** | React Hook Form + Zod. Settings edit **in place** in a `SettingsTable`. Drafts survive refresh (`use-form-draft.ts`, secret values excluded). `unsaved-changes-guard.tsx` asks before leaving. Server errors map back to fields. A sticky action bar appears only when there are changes. |
| **Environment edits** | Saved values are write-only (masked pill + "encrypted · 4 Sept 2026"). Rows show `CHANGED` / `REMOVING` (struck through, with Undo) / `NEW` tags and a left colour edge. A sticky summary bar shows `+1 added ~1 replaced -1 removed` with Discard / Save / **Save & redeploy**. Drag a `.env` file onto the page or use "Import .env", which previews each variable as NEW or UPDATE before importing. |
| **Confirmations** | One app-wide `useConfirm()`: `await confirm({ title, description, details, confirmLabel, tone, confirmText, action })`. The button says the verb. Destructive: red `danger` button, **Cancel focused first**; `confirmText` makes you type the email or project name. With `action`, the dialog runs the mutation, spins, and shows the error inline with "Try again". |
| **Undo vs confirm** | Reversible actions can skip the question and offer Undo instead (`notify.undo`, 8s). Rollback currently does both: it confirms, then offers Undo to roll forward. |
| **Notifications** | `notify` over sonner: short past-tense outcomes ("Redeploy started", "Variables saved") with a useful action ("View logs"). Toasts only when the result isn't already visible on screen; otherwise inline. `notify.promise` follows a mutation. Errors are always a sentence from `errorMessage()`. |
| **Callouts** | Page-level, persistent: e.g. "Bandwidth at 84% of your limit", with a link to Usage. Dismissal is remembered per device. |
| **Live updates** | Polling only while something is in flight: deployments `2000ms` while any is in progress, project list `3000ms`, logs `1000ms` until `done`, traffic `1500ms`, activity `5000`/`10000ms`. Default `staleTime 60_000`. |
| **Logs** | Grouped by step (collapsible, with state and duration), follows the newest line while live; scrolling up stops following and shows a "jump to latest" pill; search filters and highlights; copy and download. |
| **Keyboard** | `⌘/Ctrl+K` palette · `/` palette (when not typing) · `⌘/Ctrl+B` sidebar · arrow keys in the repo list · `Esc` closes overlays · Enter submits dialogs (they're `<form>`s). |

---

## 9. Copy and tone

Source: `docs/product-blueprint.md` "Brand & tone". Kitchen lines ("Your Galley") are the
workspace name only. **Everything else is plain, serious and technical.**

| Rule | Examples from the code |
|---|---|
| Page titles are nouns, plain and technical | "Deployments", "Environment", "Usage & limits", "New deployment" |
| Descriptions are one sentence about what the page holds | "Every deployment across your projects, newest first." |
| Buttons are verbs saying what happens | "Redeploy", "Roll back", "Delete project", "Save & redeploy", "Import 3 variables". Never "OK" or "Yes" (a rule in `ConfirmOptions`). |
| Confirm titles are the question with the object | "Redeploy orders-api?" · "Roll back orders-api to 72c32b8?" · "Delete your account?" |
| Confirm descriptions state the consequence | "The live deployment keeps serving traffic until the new one is running." · "This can't be undone. All 3 of your projects go offline immediately…" |
| Toasts are short and past-tense | "Variables saved" · "Commit SHA copied" · "Imported 3 variables" |
| Errors: no blame, one way forward | "This didn't load." / "Something went wrong on our side. Try again — if it keeps happening, contact support." · "Can't reach Deplogram. Check your connection." · "Something changed in the meantime. Refresh and try again." |
| Empty vs no-match | "No deployments yet." vs "No deployments match." / "Try a different search, or remove some filters." |
| Calm "all good" states | "All quiet — nothing deploying, nothing failing." |
| Activity is sentences | "Ngozi Eze deployed admin-dashboard", "orders-api is live" |
| Status labels are lifecycle words | Queued, Building, Built, Deploying, Running, Ready, Build failed, Deploy failed, Crashed |
| Labels are short; values are mono | "Branch" `main` · "Commit" `5210972` · "Requests · 30d" |

Not decided carefully: `EmptyState` allows "personality, sparingly", and Overview uses
**"Nothing on the counter yet."** That contradicts the blueprint's no-food-metaphors rule. Pick one.

---

## 10. Accessibility and theming

### Contrast (computed from OKLCH lightness; for neutrals Y ≈ L³)

| Text | On | Dark | Light |
|---|---|---|---|
| foreground | panel | ~16:1 | ~19:1 |
| muted-foreground | panel | ~6.9:1 | ~5.3:1 |
| muted-foreground | well (card) | ~7.6:1 | ~4.9:1 |
| muted-foreground | raised | ~6.6:1 | ~5.3:1 |
| muted-foreground | popover / row hover | ~6.1 / 5.7:1 | ~5.3:1 |
| muted-foreground | **sunken** | ~7.9:1 | **~4.4:1, below AA** |
| brand-ink | panel | ~5.6:1 | ~5.1:1 (on white) |
| brand-foreground | flat brand | ~6.4:1 | same |

The one known failure: light-mode muted text on `surface-sunken`. That covers unselected
`Segmented` labels, chips and sunken meta. Fix it by darkening light `--muted-foreground` to about
`0.5`. Placeholder text at `muted-foreground/50` is intentionally below AA. Contrast on the metal
gradient's darkest band hasn't been measured.

### Focus and semantics

- Focus ring is brand-ink at 50%: `focus-visible:ring-3 ring-ring/50`. Never removed without a
  replacement.
- Every icon-only control has an `aria-label`. Active nav has `aria-current="page"`. `Segmented` is
  `role="tablist"`/`tab` with `aria-selected`.
- Meters are `role="meter"` with `aria-valuenow`/`max`. Charts and decorative motion are
  `aria-hidden`. The map canvas is `role="img"` with a summarising `aria-label`.
- `ErrorState`, danger and warning callouts use `role="alert"`. Loaders use `role="status" aria-live="polite"`.
  Tables have an `sr-only` caption and `aria-busy` while loading.
- Status is never colour-only: there's always a label ("Build failed") or a shape change
  (hollow = queued).

### How dark and light are built

- next-themes `attribute="class"`, default **dark**, system preference ignored. Dark is the
  designed theme; light is the derived one and gets less attention (honest).
- `:root` = light tokens, `.dark` = dark tokens. Then the app re-maps a subset under
  `html:has([data-app])` and `html.dark:has([data-app])` (§3.1).
- Utilities read tokens, so they work in both themes without `dark:` variants: `surface-*`,
  `metal-brand`, `skeleton` (beam strength: light `oklch(1 0 0 / 55%)`, dark `/ 17%`).
- The canvas map can't read CSS, so `readColors()` pulls the computed `--foreground`, `--brand` and
  `--destructive`, and a `MutationObserver` on `<html class>` re-reads them on theme switch.
- `disableTransitionOnChange` keeps the theme from cross-fading every element.

### Checked every time (the working checklist)

1. Does every element differ in tone from what it sits on?
2. Is there exactly one metal (primary) action on the screen?
3. Any outer shadow? Remove it (inset only).
4. Loading, empty, no-match and error states all render in the real layout?
5. Reduced motion: does anything still loop?
6. Tested at phone width (390px): tables hide columns, the pipeline stacks, the header trims.
7. No `--color-*` var in inline styles (use the raw `var(--chart-1)`).
8. Mono for machine values, `tabular-nums` on every number that updates.

---

## 11. Anti-patterns (avoided or removed)

| Removed / avoided | Replaced with | Why |
|---|---|---|
| **Four-step new-deployment wizard**: stacked titled cards, an icon tile on everything, a description under every field, big radio cards with sentences, status callouts | One master–detail screen: repos left, editable config right, sticky Deploy bar (`a6ac883`) | The user called it "AI slop". The references they liked (Linear-style tools) are dense, quiet and edit in place. `forms/wizard.tsx` survives only in the dev playground. |
| **Flattened surfaces** (tables, tiles and inputs all on the panel colour) | The frame → panel → well ladder plus `surface-raised/sunken/band` (`eb983e5`) | "THERE IS NO FREAKING DEPTH". Simplifying must never remove tone steps. |
| **Drop shadows and coloured glows under cards and nodes** | Inset highlights and tone steps | User preference, a standing rule. |
| **The orange haze/glow behind the project title** | A plain dot grid fading out + a hairline top highlight | "remove that glow… it's giving AI slop". The title was also made smaller (`text-[1.75rem]`). |
| **Brand orange on every CTA** | One metal primary per view; `outline`/`ghost` otherwise | Orange everywhere stopped meaning anything. |
| **Lenis smooth scroll in the app** | Native scroll + a custom `PageScrollbar`; Lenis only in the marketing `(base)` layout | It hijacked the wheel, so nested scrollers (build logs) couldn't scroll. |
| **A scroll container inside the panel** | Page-level scroll with a sticky corner cap | Native page scroll keeps find-in-page, keyboard and restoration. |
| **Per-element shimmer skeletons** | One viewport-fixed beam crossing every skeleton | Fifty unsynced shimmers looked like noise. |
| **Restarting "ping" circles on the map** | SVG sonar → then canvas waves travelling *through* the dot grid, sized by traffic | The pings looked "weird" and said nothing about volume. |
| **Spinners for content loading** | Skeletons in the real shape; spinners only for actions | Shows what's coming. |
| **Count-up animations on live numbers** | Static values | Re-counting on every poll would look fake. |
| **A white label on orange** | Near-black `--brand-foreground` | About 3.1:1 vs 6.4:1. |
| **Food metaphors in UI copy** | Plain technical language | Blueprint rule (one exception still leaks, §9). |

Still in the code, against the rules (honest list):

- Small outer glows remain on "live" markers: `StatusDot` `shadow-[0_0_8px_currentColor]`,
  the sparkline end dot, the live reel rail dot, the newest `SignalBars` bar, the flowing pipeline
  cable, the nav progress bar and the dragged scrollbar.
- shadcn primitives still carry their stock outer shadows: `input`/`select`/`textarea`/`checkbox`/`switch`
  `shadow-xs`, `dropdown-menu` `shadow-md`/`shadow-lg`, `sheet` `shadow-lg`, `ui/chart.tsx` tooltip
  `shadow-xl`. Nobody went through `ui/`.
- `docs/design-system.md` still says lucide icons, Lenis in global providers and Inter Tight body.
  All three are wrong for the app.

---

## 12. Screenshot walkthrough (the gallery, 01–30)

Captured at 1440×900 @2x (desktop) and 390×844 @3x (mobile), dark unless noted. Files with
`-1`, `-2`… are one page scrolled top to bottom.

| # | File(s) | What's on it | Why it's arranged this way | Rules shown |
|---|---|---|---|---|
| 01 | `01-overview-1…2` | Greeting (cycling language, mono gloss) + `3 live · 1 deploying · 1 needs attention`; four figures with faint watermark icons and meters; project tiles with 30s heartbeats and a dashed "New deployment" tile; live map + per-second signal; "Right now"; Activity rail. | State first (the status line), then capacity (figures), then your things (projects), then the live world. Projects were moved above the map on request. | §2 state-first · one metal button · §3 well/raised tiles · §6 live motion · §7 meters |
| 02 | `02-projects` | Segmented filter with counts, search, project cards with status pills, latest commit and a 10-block track record. | Cards, not a table: 3–10 projects, and each needs its state at a glance. | Segmented counts · tone pills · mono SHAs |
| 03 | `03-project-overview-1…2` | Stage (name, Live pill, URL, chips, Redeploy/Visit/Logs, latest deployment box, live signal strip) → Reel → Vitals + Spec. | Identity and state, then history, then numbers. The live signal sits on the Stage's sunken floor. | §1 aliveness · one primary (Redeploy) · sunken strip · reel stagger |
| 04 | `04-project-deployments` | `DataTable` of this project's deployments. | Dense rows, the whole row a link, `⋯` actions. | §8 tables · dot status with durations |
| 05 | `05-deployment-building` | Pipeline mid-build: Source done (green), Build current (orange border + orbiting beam, ticking `2.9s`), Deploy/Live dashed and waiting; fact row; build log with groups, a warn line in brand-ink, the cursor and "Building…". | Pipeline answers "where is it", the log answers "what is it doing". The current stage is the only lit thing. | §6 progress motion · §3 brand = working · log stream |
| 06 | `06-deployment-live-1…2` | Same page, all stages green, live node, complete log. | Settled = still; only the live marker moves. | motion carries meaning |
| 07 | `07-deployment-failed-1…2` | Failed stage and cable in red, the log open at the failing group. | Red only where it failed; everything else stays neutral. | §3.2 destructive = failure only |
| 08 | `08-project-logs` | Runtime logs with level/tag columns and filters in the toolbar. | Same `LogViewer` as builds: one component, one behaviour. | reuse of building blocks |
| 09 | `09-project-metrics-1…2` | Range segmented control; area/bar charts with headline numbers and deltas. | Number first, then shape; greys, with one brand series. | §7 chart rules · axis pill |
| 10 | `10-project-environment` | Toolbar (filter, count, Import .env, Add variable); saved values as masked mono pills with "encrypted · date". | Saved secrets are write-only, and the UI says so in the description. | §9 descriptions · sunken value troughs |
| 11 | `11-project-environment-editing` | `CHANGED`, `REMOVING` (struck, with Undo) and `NEW` rows with coloured left edges; sticky bar `+1 added ~1 replaced -1 removed` with **Save & redeploy**. | Show the diff before the change: the user is nervous here. | §1 trust · one metal action · undo |
| 12 | `12-project-environment-import` | Import dialog: paste area left, preview right with UPDATE (brand) / NEW (green) tags; "Import 3 variables". | The preview removes the fear of overwriting. Buttons count what they'll do. | dialogs only for focused tasks · verb + count |
| 13 | `13-project-settings-1` | Settings in a two-tone `SettingsTable`, edited in place. | No form-per-card; labels on the darker band. | `surface-band` · mono inputs |
| 14 | `14-deployments-1…2` | Workspace deployments table; a bandwidth callout ("at 84% of your limit") at the top. | The callout is in the page, not a toast, because it's a persistent condition. | callouts vs toasts · brand = near limit |
| 15 | `15-deployments-add-filter` | "Add filter" menu → filter chips. | Filters become URL state and shareable views. | §8 filters |
| 16 | `16-deployment-actions-menu` | Row `⋯` menu: Visit, View build logs, Copy commit SHA, Redeploy, Roll back to this. | Actions live with the row; only valid actions show. | contextual actions |
| 17 | `17-redeploy-confirm` | "Redeploy orders-api?", the consequence sentence, the commit in a recessed box, Cancel / **Redeploy**. | The verb on the button; `details` shows exactly what's affected. | §8 confirm · §9 copy |
| 18 | `18-new-deployment` | Master–detail with no repo chosen: repo list (filter, search, arrow keys) and an empty detail pane. | One screen instead of a wizard. | §11 wizard removal |
| 19 | `19-new-deployment-configured-1…2` | A repo chosen: fact tiles (branch, commit, detected runtime), runtime grid, settings table, env table, sticky URL + **Deploy** bar. | Everything visible and editable in place; detection pre-fills without overwriting edits. | density · one metal action · drafts |
| 20 | `20-usage-and-limits-1…3` | Limits up top (meters coloured by `limitTone`), then requests, builds, bandwidth, heatmap, storage. | The worry ("am I near a limit?") is answered first; detail below. No prices. | §7 meters, heatmap · brand ≥80% |
| 21 | `21-activity-1…4` | Timeline grouped by day (sticky day headers with counts), filters, an icon rail, sentence events, "Load older activity". | History reads as sentences, not log rows. | §9 activity copy · new events animate in |
| 22 | `22-settings-general` | Account settings, narrow page width. | Forms get a comfortable line length (`max-w-3xl`). | page widths |
| 23 | `23-delete-account-confirm` | Danger confirm: red icon tile, consequence, **type your email to confirm**, red "Delete account". Cancel is focused first. | Friction scales with irreversibility. | destructive confirm rules |
| 24 | `24-command-palette` | `⌘K`: projects with status dots, pages, footer hints (`>` Actions, `@` Projects). | Everything is reachable by keyboard from anywhere. | §8 keyboard |
| 25 | `25-light-overview-1…2` | Overview in light mode. | Same ladder inverted: frame `0.955`, panel white, wells `0.977`. | §10 theming |
| 26 | `26-light-project-overview` | Project overview, light. | Metal and status tones unchanged; brand-ink darkens for text. | brand-ink swap |
| 27 | `27-light-deployment-live` | Live deployment, light. | | |
| 28 | `28-mobile-overview-1…3` | Phone: title wraps, figures 2×2, tiles stacked, map below. | Same hierarchy, single column; the header trims crumbs. | §4 responsive |
| 29 | `29-mobile-project-overview-1…3` | Stage stacked: identity → actions → latest → signal; reel scrolls sideways. | Order follows importance, not the desktop columns. | |
| 30 | `30-mobile-deployment` | Pipeline stacked vertically with vertical cables. | `max-lg` flips the cable direction (`cable-flow-y`). | responsive motion |

---

## 13. If you were rebuilding it

### Keep

- The **frame → panel → well → raised/sunken** ladder with inset-only depth. It's the single
  biggest part of the "feel".
- **One metal accent** used in a handful of places, and monochrome everything else.
- **Motion = state** (live / progress / waiting / alert / still), defined once in `StatusDot` and
  `deploymentStatusMeta`.
- The viewport-fixed skeleton beam, the axis pill on charts, and the confirm dialog that runs its
  own action.
- URL-held list state, pages over sheets, master–detail over wizards.

### Change

- Pick one well radius (`rounded-xl` *or* `2xl`) and one big-figure style (mono *or* sans; currently
  both).
- Strip stock shadows from `ui/` primitives on day one, and decide the glow exception explicitly
  (currently "small live markers").
- Fix light-mode muted contrast on sunken surfaces (~4.4:1).
- Define the app type scale as tokens (`--text-app-title` etc.) instead of the one-off
  `text-[1.75rem]`, `text-[0.6875rem]` and `text-[0.8125rem]` scattered through components.
- Remove "Nothing on the counter yet." or the blueprint rule. They contradict each other.

### The rules that matter most

1. **Every element differs in tone from what it sits on.** Raised is lighter, contained is darker.
2. **Inset shadows only.** Depth comes from tone and a 1px top highlight, never a drop shadow.
3. **One metal action per screen.** It's the forward verb. Everything else is outline or ghost.
4. **Colour means state:** orange = working/action/near-limit, green = live, red = failed. Greys
   for everything else, charts included.
5. **Live things move; settled things are still.** Never animate history or decoration.
6. **Machine values in mono with `tabular-nums`; labels short and muted; no helper sentence per field.**
7. **Dense and in place:** tables, settings tables, master–detail. No wizards, no stacked question cards.
8. **Every state is designed in the real layout:** skeleton, empty, no-match, error, refetching.
9. **Buttons say the verb; confirms show what's affected; irreversible = red + type-to-confirm + Cancel focused.**
10. **Define each recipe once** (`surface-*`, `metal-brand`, `StatusDot`, `Page`) and compose. A
    second slightly different version is a bug.

### Porting notes

| Here | Note for a port |
|---|---|
| `html:has([data-app])` token overrides | Any app-scoped CSS variable layer works. Keep the marketing tokens separate. |
| `metal-brand`, `surface-*` as Tailwind `@utility` | On web (Tailwind v4) copy them verbatim. In React Native/NativeWind, layered gradients need `expo-linear-gradient`, and inset `boxShadow` needs RN's newer `boxShadow` style (New Architecture). Check it's available before relying on it. Otherwise fake the top highlight with a 1px top border at `foreground/7%`. |
| Viewport-fixed skeleton beam | `background-attachment: fixed` doesn't exist in RN. Approximate it with one shared animated value driving every skeleton's gradient offset. |
| Polling intervals | Tied to "something in flight". Keep that principle (poll only while a payment or transaction is pending). |
