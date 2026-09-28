# Deplogram Design System

Read this whole file before touching any UI in this repo. Reference implementation:
whatever page/component was built most recently — check its patterns before inventing a new one.
At the time of writing that is the homepage (`src/app/(base)/page.tsx`) and everything it composes.

> Stack context: Next.js 16 (App Router) · Tailwind CSS v4 · shadcn/ui on **Base UI** primitives
> (preset `b30i7gTxa6`, style `base-vega`) · Motion 12+ (`motion/react`) · Lenis · lucide-react.
> Package manager is **Bun** — `bun` / `bunx` only.
>
> Product facts, positioning and pricing come from **`docs/product-blueprint.md`** — read it before writing copy.

---

## Philosophy

1. **One name, one recipe.** Every recurring visual pattern (card, pill, section header, node) has a
   name and a single class recipe defined here. Two components rendering the same kind of thing with
   slightly different classes is a bug, not a variant.
2. **Depth comes from the elevation ladder, not from decoration.** Canvas → Surface → Control →
   Floating. No ad hoc gradients, glows or shadows per section. The *one* earned glow is the lit
   "live" node of the NodeGraph motif.
3. **Colour and weight carry state first.** An active nav link is foreground colour + an underline
   indicator, not a new component. Reach for a colour change before a badge.
4. **Motion is rich but disciplined.** The motion budget on this site is big — but it is spent through
   the primitives in `src/components/shared/motion/`, one easing curve, `transform`/`opacity` only, and
   every primitive ships a `prefers-reduced-motion` fallback. Non-negotiable.
5. **One vocabulary across every page.** Home, Pricing, Blog, Docs, Legal all use the same button,
   card, section-header and prose recipes. A different-looking card must be a documented variant.
6. **Delete before you add.** No unused variants survive once a pattern is final.

---

## Tokens

All tokens live in **`src/app/globals.css`** (CSS variables + Tailwind v4 `@theme inline`). JS-side
values that can't read CSS (OG image, icons, motion curves) live in **`src/lib/theme.ts`** and
`src/lib/motion.ts` and must be kept in sync with the CSS — each has a comment pointing back here.

> Tailwind v4 has no `tailwind.config.ts`; the brief's "theme extensions" are the `@theme inline`
> block in `globals.css`. See Retrospective Log 2026-09-24.

### Brand colour

| Token | Dark (default) | Light | Use |
|---|---|---|---|
| `--brand` → `bg-brand` | `#FF5C35` | `#FF5C35` | Solid fills: primary buttons, lit nodes, live dots. |
| `--brand-foreground` → `text-brand-foreground` | near-black `oklch(0.145 0 0)` | near-black | Text/icons **on** a brand fill. Near-black is 6.4:1; white is only 3.1:1 — never white. |
| `--brand-ink` → `text-brand-ink` / `stroke-brand-ink` | `#FF5C35` (6.8:1 on black) | deep orange `oklch(0.56 0.19 34.6)` ≈ `#CB3810` (5.1:1 on white) | Brand-coloured *text or strokes on the canvas*. `#FF5C35` text on white is 3.1:1, so light mode swaps to a darker ink. |
| `--primary` | `= --brand` | `= --brand` | shadcn's primary slot — buttons `variant="default"` are brand orange. |
| `--ring` | `= --brand-ink` | `= --brand-ink` | Focus rings (`outline-ring/50` globally). |
| `--destructive` | `oklch(0.68 0.2 12)` | `oklch(0.58 0.22 12)` | Errors only. Pushed to a crimson hue (12°) so it never reads as the brand orange (34.6°). |

`#FF5C35` is `oklch(0.686 0.205 34.6)` — a warm orange-red. Because it sits near red, **never use the
brand colour to signal errors or "degraded"**, and never use `destructive` as decoration; errors always
carry text, not colour alone. Swap in one line (`--brand`, plus `--brand-ink` and `src/lib/theme.ts`).

### Neutrals (achromatic — pure black canvas)

Chroma is **0** on every neutral: no warm/olive/blue tint. Dark mode is a true `#000` canvas with
near-black surfaces; light mode mirrors it on pure white.

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg-background` | `oklch(0 0 0)` = `#000` | `oklch(1 0 0)` = `#fff` | Canvas. |
| `bg-card` | `oklch(0.145 0 0)` ≈ `#0a0a0a` | `oklch(1 0 0)` | Surface. |
| `bg-popover` | `oklch(0.18 0 0)` ≈ `#111` | `oklch(1 0 0)` | Floating. |
| `bg-muted` | `oklch(0.22 0 0)` | `oklch(0.97 0 0)` | Controls, code blocks. |
| `text-muted-foreground` | `oklch(0.72 0 0)` (8.5:1) | `oklch(0.53 0 0)` (5.3:1) | Secondary copy, unlit nodes. |
| `border-border` | `white / 10%` | `oklch(0.92 0 0)` | Hairlines, edges. |

### Elevation ladder

Defined as `@utility` classes in `globals.css` so the recipe lives in one place.

| Level | Class | Recipe | Used by |
|---|---|---|---|
| Canvas | `bg-background` | — | `<body>`, full-bleed sections |
| Surface | `elevation-surface` | `bg-card text-card-foreground border border-border/70` | Feature, pricing, blog, role, status cards; panels |
| Control | `elevation-control` | `bg-muted/70 ring-1 ring-border/50` | Outline buttons, inputs, nav pills, code chips |
| Floating | `elevation-floating` | `bg-popover text-popover-foreground shadow-2xl ring-1 ring-border` | Sheet, dropdowns, nav menu popup, command palette (all portaled) |

### Radius scale (`--radius: 0.625rem`)

| Class | Value | Use |
|---|---|---|
| `rounded-md` | 8px | Inputs, small chips, code inline |
| `rounded-lg` | 10px | Icon tiles inside cards |
| `rounded-2xl` | 18px | **Surface cards** (the default card radius) |
| `rounded-3xl` | 22px | Large panels: hero visual, CTA banner, terminal window |
| `rounded-full` | pill | **Buttons**, badge pills, node dots |

### Type scale

Fonts via `next/font/google` in `src/app/layout.tsx`:

| Token | Font | Use |
|---|---|---|
| `font-heading` → `--font-host-grotesk` | Host Grotesk | Headings, hero, display, wordmark |
| `font-sans` → `--font-inter-tight` | Inter Tight | Body, UI labels, buttons, nav, small print |
| `font-mono` → `--font-geist-mono` | Geist Mono | Terminal, code, eyebrows only |

| Class | Size | Line-height / tracking | Use |
|---|---|---|---|
| `text-display` | `clamp(2.75rem, 1.6rem + 5.2vw, 5.75rem)` | 1.0 / -0.035em | Homepage hero headline only |
| `text-title` | `clamp(2.25rem, 1.5rem + 3.2vw, 4rem)` | 1.05 / -0.03em | Sub-page `<h1>` (PageHeader) |
| `text-heading` | `clamp(1.875rem, 1.3rem + 2.2vw, 3rem)` | 1.1 / -0.025em | Section `<h2>` (SectionHeader) |
| `text-subheading` | `1.25rem` | 1.35 / -0.015em | Card titles in large cards, article `<h3>` |
| `text-lead` | `clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)` | 1.6 | Hero/section descriptions |
| `text-base` | 1rem | Tailwind default | Body |
| `text-sm` | 0.875rem | Tailwind default | Card body, UI |
| eyebrow | `font-mono text-xs uppercase tracking-eyebrow` | `--tracking-eyebrow: 0.14em` | Section eyebrows, table heads |

Headings are `font-heading font-semibold text-balance`. Body copy is `text-pretty`.

### Layout & spacing

| Name | Recipe |
|---|---|
| Container | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` (`<Container>`; `size="narrow"` → `max-w-3xl` for prose) |
| Section rhythm | `py-20 sm:py-24 lg:py-32` (`<SectionWrapper>`; `spacing="compact"` → `py-12 sm:py-16`) |
| Header → content | `mt-12 sm:mt-16` |
| Card padding | `p-6` (cards), `p-6 sm:p-8` (hairline cells) |
| Grid gap | `gap-4` (cards), `gap-px` (hairline grids — the gap *is* the rule) |

### Glow & texture tokens

| Token | Class | Use |
|---|---|---|
| `--shadow-glow` | `shadow-glow` | HTML lit node dot (`NodeDot lit`) |
| `--drop-shadow-glow` | `drop-shadow-glow` | SVG lit node in `NodeGraph` |
| `bg-dot-grid` | utility | Dotted grid texture behind hero visual/page headers |
| `spotlight` | utility | Cursor-tracked radial wash in `SpotlightCard` |

---

## Component Recipes

### Button (`src/components/ui/button.tsx`)

Pill-shaped. Use `buttonVariants` on a `next/link` for navigation (Base UI's `Button` renders a
`<button>`; don't nest a link inside it).

```tsx
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

<Link href="/pricing" className={buttonVariants({ size: "lg" })}>Start for free</Link>                         // brand (orange)
<Link href="/" className={buttonVariants({ variant: "inverted", size: "lg" })}>Back to home</Link>               // inverted
<Link href="/docs" className={buttonVariants({ variant: "outline", size: "lg" })}>View docs</Link>               // secondary
<Button variant="ghost" size="icon" aria-label="Toggle theme"><Icon name="sun" /></Button>                      // icon-only: aria-label required
```

Which variant when:

| Variant | Recipe | Use |
|---|---|---|
| `default` (brand) | `bg-primary text-primary-foreground` (brand orange) | **One** primary conversion action per view: hero, CTA banner, highlighted pricing card |
| `inverted` | `bg-foreground text-background` (white in dark, black in light) | Every other solid CTA: navbar, mobile nav, Free plan, 404/error, forms |
| `outline` | hairline + `bg-background` | Secondary action next to a solid button |
| `ghost` | transparent | Icon buttons, "Sign in", tertiary |

Sizes (pill, `px-4.5` everywhere): `sm` h-8 (navbar), `default` h-9, `lg` h-10 (all section and hero CTAs).
Wrap hero/CTA-banner primaries in `<Magnetic>`.

### Card — Surface (`src/components/ui/card.tsx`)

The shadcn `Card` *is* the surface recipe (edited to use `elevation-surface rounded-2xl`).

```tsx
<Card className="p-6">…</Card>          // generic surface
<SpotlightCard>…</SpotlightCard>        // interactive surface (feature/API cards)
```

`FeatureCard` (`src/components/marketing/feature-card.tsx`): icon tile + title + description, `p-6 gap-4`,
on a `SpotlightCard`. Icon tile inside a card: `flex size-10 items-center justify-center rounded-lg elevation-control text-brand-ink`.

### Feature layouts — pick by job, don't default to cards

Cards everywhere made every section look the same. A list of features now picks one of four layouts;
`FeatureSection display="…"` switches between the first three.

| Layout | Component | Looks like | Use when | Used by |
|---|---|---|---|---|
| `cards` | `FeatureGrid` → `FeatureCard` | Separate Surface cards with icon tiles | A few peer items that each deserve weight | Values, perks, billing model |
| `matrix` | `FeatureMatrix` | One hairline grid, numbered cells (`01`…), icon + mono index | A spec sheet of capabilities | Deployment features |
| `list` | `FeatureList` | No cards: icon + title + one-liner over a top hairline | Many small items (8+) | Developer utilities |
| bento | `ApiBento` | One hairline grid, mixed spans, each cell has a mini-UI | The flagship showcase — one per page, max | APIs |

Link cards (`LinkCardGrid`) are separate: they navigate. Rule: two adjacent sections never use the same layout.

### Hairline grid (`hairline-grid` / `hairline-cell` utilities in `globals.css`)

Cells on the canvas divided by 1px rules — the Render/Linear "bento" look. The rule is the grid's
background showing through `gap-px`, so **every row must be full** (an empty slot shows as a grey block).

```tsx
<ul className="hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">   // grid-cols-1 = minmax(0,1fr): stops long mono text widening the cell on mobile   // gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70
  <li className="hairline-cell">                                 // bg-background hover:bg-card
    <StaggerItem className="flex h-full flex-col gap-3 p-6 sm:p-8">…</StaggerItem>
  </li>
</ul>
```

Animate the cell *content*, never the cell: a fading cell exposes the rule colour behind it.

### API bento (`api-bento.tsx` + `api-visuals.tsx`)

Hairline grid, `md:grid-cols-2 lg:grid-cols-3`. `wide` items span 2 and go text-left / visual-right at
`lg`; narrow items stack text over visual. Data order alternates wide/narrow, narrow/wide so rows fill.
Each cell's mini-UI lives in `api-visuals.tsx`, is `aria-hidden`, and is built only from the
existing recipes — the preview row is `flex items-center gap-3 rounded-lg elevation-control px-3 py-2.5 text-xs`.

### Pricing card (`src/components/marketing/pricing-card.tsx`)

A documented variant of Surface: `p-6` (not `sm:p-8` — four plans sit in one row at `lg`), name +
`position` line, price (`null` → "Custom"). `highlighted` adds `border-brand-ink/60` + a
`BadgePill variant="brand"`. Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`.

```ts
base:        "relative flex h-full flex-col gap-6 rounded-2xl elevation-surface p-6"
highlighted: { true: "border-brand-ink/60 ring-1 ring-brand-ink/20", false: "" }
```

CTA variant: `default` (brand) on the highlighted plan, `inverted` on Freebies, `outline` otherwise.

### Link card grid (`src/components/marketing/link-card-grid.tsx`)

FeatureCard-style surfaces that navigate (icon tile + title + arrow + description, `p-6`).
`columns`: `2` (docs index) · `5` (homepage pillars: `sm:grid-cols-2 lg:grid-cols-5`).

### Product panel (`src/components/marketing/product-panels.tsx`)

For a pillar that needs more than a card (Storage, Domains). One full-width Elevated panel per
pillar, stacked `gap-4`, each its own anchor (`id`). Copy side is a `SectionHeader` + a check-icon
list; the other side is an illustrative preview. Every second panel flips sides at `lg`.

```tsx
"grid grid-cols-1 items-center gap-10 rounded-3xl elevation-surface p-6 sm:p-10 lg:grid-cols-2 lg:gap-16"
// preview inset (StoragePreview, DomainPreview, DeployPreview):
"relative overflow-hidden rounded-2xl bg-background/60 p-4 sm:p-5"  // + bg-dot-grid mask-fade-edges layer
// preview row:
"flex items-center gap-3 rounded-lg elevation-control px-3 py-2.5 text-xs"  // mono label, muted meta
```

### Badge / pill (`src/components/shared/badge-pill.tsx`)

```ts
base:    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
variant: {
  default: "elevation-control text-muted-foreground",
  brand:   "bg-brand text-brand-foreground",
  outline: "border border-border text-muted-foreground",
}
// optional leading `dot` renders <NodeDot lit /> — the live signal
```

Runtime logos in the strip are `BadgePill` + `Icon`, never raster logos (no real logos until assets land).

### Nav link

```tsx
// active: aria-current="page" + text-foreground + motion underline (layoutId="nav-underline")
"relative px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground"
```

### Section header (`src/components/marketing/section-header.tsx`)

```tsx
<SectionHeader
  eyebrow="Deployment engine"      // font-mono text-xs uppercase tracking-eyebrow text-brand-ink
  title="Push code. Get a URL."   // font-heading text-heading font-semibold text-balance
  description="…"                  // text-lead text-muted-foreground max-w-2xl mt-4
  align="center" | "left"
/>
```

### Page header (`src/components/marketing/page-header.tsx`)

Every sub-page opens with it: eyebrow + `text-title` h1 + lead, over `bg-dot-grid` with a
`NodeGraph` texture. `pt-32 sm:pt-40 pb-12 sm:pb-16` (clears the fixed navbar).

### Prose (`src/components/marketing/prose.tsx`) + ContentBlocks

One long-form recipe for blog articles, docs, and legal. Content is typed blocks
(`src/content/types.ts → ContentBlock`), rendered by `<ContentBlocks blocks={…} />` inside `<Prose>`.

### Elevated panel

Hero visual, CTA banner, terminal: `elevation-surface rounded-3xl overflow-hidden`.

### Motion primitives (`src/components/shared/motion/`)

| Primitive | Signature | Default use |
|---|---|---|
| `FadeInUp` | `<FadeInUp delay?={0} as?="div">` | Section headers, single blocks |
| `StaggerGroup` / `StaggerItem` | `<StaggerGroup as?="div"\|"ul"><StaggerItem as?="div"\|"li">` | Card grids, pill rows, lists |
| `Magnetic` | `<Magnetic strength?={0.25}>` | Primary CTAs only |
| `HoverScale` | `<HoverScale scale?={1.02}>` | Cards, pricing cards, badges |
| `TextReveal` | `<TextReveal as="h1" text="…" highlight={["Ship."]} />` | Hero headline |
| `AnimatedCounter` | `<AnimatedCounter value={10} suffix="+" />` | Stats row |
| `Marquee` | `<Marquee duration?="40s">` | Runtimes strip |
| `SpotlightCard` | `<SpotlightCard className>` | Feature cards, link cards |
| `TerminalTyping` | `<TerminalTyping lines={deployFlow} onProgress? loop? />` | Hero deploy visual |
| `SmoothScroll` | wraps app in `providers.tsx` | Lenis (disabled on reduced motion) |

---

## Brand Motif — NodeGraph

**The most important recipe in this file.** Small connected nodes joined by thin lines — literally a
diagram ("Deplo-*gram*"). It replaces every rocket/cloud/astronaut you'd expect on a deploy site.
**Do not substitute a generic rocket, cloud, or astronaut icon anywhere.**

Single definition: **`src/components/shared/node-graph.tsx`** (component + `NodeDot`) and
**`src/lib/node-graph.ts`** (spec constants + named layouts). Every surface imports from there.

### Spec (`NODE_GRAPH_SPEC`, in viewBox units)

| Size | Node radius | Node stroke | Edge stroke | Lit halo radius | Used by |
|---|---|---|---|---|---|
| `mark` (viewBox 24×24) | 2.75 | 1.75 | 1.5 | — (no halo at icon size) | Logo, favicon, apple icon |
| `diagram` | 5 | 1.5 | 1.25 | 11 | Hero, status, how-it-works, textures, dividers |

Layout rules: nodes sit on a loose grid; edges are straight in `mark`, horizontal cubic curves in
`diagram` (`M x1 y1 C mx y1, mx y2, x2 y2`). Minimum node spacing is 6× node radius. Exactly one
node per layout is the `live` node.

### Colours

| Part | Unlit | Lit |
|---|---|---|
| Node | `fill-background stroke-muted-foreground` | `fill-brand stroke-brand drop-shadow-glow` |
| Edge | `stroke-muted-foreground/35` | `stroke-brand-ink/70` |
| Halo (diagram only) | — | `fill-brand/15`, pulses once (scale 1 → 1.8, opacity → 0) on going live |
| HTML dot (`NodeDot`) | `size-2.5 rounded-full border-[1.5px] border-muted-foreground bg-background` | `bg-brand border-brand shadow-glow` |

The glow is the brand's "something is live" signal — it is only ever on a lit node.

### States

| `state` | Behaviour | Where |
|---|---|---|
| `idle` | Everything drawn, unlit, static | Background textures, dividers |
| `loading` | Nodes light up one by one in `layout.order`, loop | Build/progress indicators |
| `live` | Entrance (nodes scale in, edges draw via `pathLength`), then the live node lights and pulses once | Hero, status page, logo (with `animated={false}`) |
| controlled `progress={n}` | First *n* nodes of `order` lit; `n >= nodes.length` → live | Hero (synced to `TerminalTyping`) |

Texture use = `state="idle"` inside a wrapper at `opacity-15` (dark) / `opacity-25` (light), behind
content, `aria-hidden`. Never animated, never above content.

Named layouts in `src/lib/node-graph.ts`: `mark`, `pipeline` (deploy demo), `workflow` (how it works:
utility → api → deploy → store + domain → scale), `divider`, `texture`, `status`.
Add a new *layout* when needed — never a new node/edge style.

---

## Motion

Defined once in **`src/lib/motion.ts`** (mirrored as `--ease-out-expo` in CSS for Tailwind transitions).

| Name | Value | Use |
|---|---|---|
| `EASE_OUT` | `[0.16, 1, 0.3, 1]` (`ease-out-expo`) | All entrances |
| `EASE_IN_OUT` | `[0.65, 0, 0.35, 1]` | Looping / cross-fades |
| `DURATION.fast` | 0.3s | Micro-interactions, tab cross-fades |
| `DURATION.base` | 0.5s | Entrances |
| `DURATION.slow` | 0.6s | Large panels, headline words |
| `STAGGER` | 0.06s | Between staggered children |
| `SPRING.snappy` | `{ stiffness: 400, damping: 30 }` | Hover scale, buttons |
| `SPRING.magnetic` | `{ stiffness: 200, damping: 18, mass: 0.2 }` | Magnetic CTA |
| `VIEWPORT` | `{ once: true, amount: 0.2 }` | Every `whileInView` |

Rules: entrances trigger **once**. Animate only `transform` / `opacity` (plus SVG `pathLength` in the
motif). Interactive motion is spring-based. `<MotionConfig reducedMotion="user">` is set app-wide,
and each primitive additionally checks `useReducedMotion()` to drop custom behaviour (magnetic pull,
spotlight tracking, typing → instant, counter → final value, marquee → static wrap, Lenis → off).
CSS animations use `motion-reduce:animate-none`.

Approved primitives are the table above — nobody invents a 7th way to fade something in.

---

## Accessibility & Code Conventions

- **Tokens only for colour.** `bg-card`, `bg-muted`, `border-border`, `text-brand-ink` — never raw
  hex/`zinc-*`/`neutral-*` for chrome. (Exception: `ImageResponse` files, which can't read CSS — they
  import from `src/lib/theme.ts`.)
- **Tailwind v4 canonical classes.** `wrap-break-word` not `break-words`, `bg-white/6` not
  `bg-white/[0.06]`, `z-70` not `z-[70]`, `bg-linear-to-br` not `bg-gradient-to-br`.
- **Everything that floats is portaled** — use shadcn `Sheet`/`Dialog`/`DropdownMenu`/
  `NavigationMenu`. Never hand-roll `position: absolute` popovers in a scroll container.
- **Base UI, not Radix.** Compose with the `render` prop, not `asChild`.
- `aria-label` on every icon-only control; `aria-current="page"` on active nav links; tabs come from
  shadcn `Tabs` (correct roles for free); decorative motif SVGs are `aria-hidden`.
- **Icons** only through `<Icon name="…" />` (`src/components/shared/icon.tsx`) — consistent size and
  `strokeWidth={1.75}`. Content files reference icons by string name so they stay serialisable.
- **Content lives in `src/content/`** as typed data. Components are presentational.
- **Shared helpers live in `src/lib/`** (`formatDate`, `createMetadata`, `siteConfig`).
- `next/image` for every raster image; `// TODO:` wherever a real asset is pending.
- Server Components by default; `"use client"` only on interactive/animated leaves.

---

## Retrospective Log

Newest first. Format: `YYYY-MM-DD — changed <thing> from <old> to <new> — reason`.

- 2026-09-28 — Container default width changed from `max-w-6xl` (1152px) to `max-w-7xl` (1280px) — set
  by the team; the four-up pricing cards and the API bento get more room.
- 2026-09-28 — Feature sections changed from one card recipe everywhere to four layouts (cards, matrix,
  list, bento) + `hairline-grid` utilities; `FeatureCard` `compact` variant, `FeatureGrid columns={5}` and
  `FeatureItem.points` removed — every section looked identical; the team asked for Render-style bento
  and more varied section designs.
- 2026-09-28 — Brand colour changed from `#D4FF00` (electric lime) to `#FF5C35` (orange-red); light-mode
  `--brand-ink` from olive-lime to `oklch(0.56 0.19 34.6)` — team rebrand. Text on brand fills stays
  near-black (6.4:1 vs white's 3.1:1).
- 2026-09-28 — Neutrals changed from olive-tinted (hue 107) to achromatic (chroma 0); dark canvas from
  `oklch(0.145 …)` to pure black `#000`, cards to `#0a0a0a`; light canvas to pure white — the team
  wants a true black, not a tinted grey, and the olive tint only existed to pair with the lime.
- 2026-09-28 — `--destructive` hue moved from ~22–27° to 12° (crimson) — the old red sat next to the new
  orange brand and errors could be mistaken for brand accents.
- 2026-09-28 — Pricing card padding from `p-6 sm:p-8` to `p-6`, grid from 3 to 4 columns — the
  blueprint has four tiers (Freebies, Plus, Pro, Enterprise).
- 2026-09-28 — Added `ProductPanel` recipe, `LinkCardGrid columns={5}` and the `workflow` NodeGraph
  layout; homepage "How it works" now tells the developer workflow instead of the deploy pipeline
  (the pipeline stays in the deploy demo) — product repositioned per `docs/product-blueprint.md`.

- 2026-09-24 — Button sizing changed from mixed padding (`px-3`/`px-3.5`/`px-4`) + an `xl` hero size to
  a uniform `px-4.5` on `sm`/`default`/`lg`, `xl` removed; added `inverted` variant — matches the
  team's button recipe from their other product, and stops lime being used on every CTA (lime is now
  reserved for the one primary action per view).
- 2026-09-24 — Heading tracking loosened (display -0.045 → -0.035em, title -0.04 → -0.03em, heading
  -0.035 → -0.025em, subheading -0.02 → -0.015em) — Host Grotesk looked cramped at the tighter values.
- 2026-09-24 — `Eyebrow` and `StatusMessage` moved from `marketing/` to `shared/` — the `(app)`
  placeholder uses them, and app code must not import marketing code.
- 2026-09-24 — `(app)` placeholder route moved from `(app)/page.tsx` to `(app)/dashboard/page.tsx` —
  both groups resolving to `/` is a build error in Next.js route groups. Swap to
  `app.deplogram.app` via `siteConfig.appUrl` once that decision is final.
- 2026-09-24 — icon library changed from hugeicons (preset default) to lucide-react — the brief
  specifies lucide and one icon vocabulary; set `iconLibrary: "lucide"` in `components.json` before
  generating components.
- 2026-09-24 — design tokens live in `globals.css` `@theme inline` instead of `tailwind.config.ts` —
  the project is on Tailwind v4, which is CSS-first and has no JS config file.
- 2026-09-24 — Button radius changed from `rounded-md` (preset) to `rounded-full`; added `xl` size —
  pills pair with the badge pills and read as the marketing CTA register.
- 2026-09-24 — Card changed from `rounded-xl ring-1 ring-foreground/10 shadow-xs` (preset) to
  `elevation-surface rounded-2xl` — Card is the Surface recipe; one definition.
- 2026-09-24 — Initial system established.
