# Deplogram: project guide for AI assistants

**Paste this whole file at the start of every AI chat about this project**
(Claude in the browser, ChatGPT and so on). The AI can't see the repo. Without
this file it guesses, and it guesses wrong: it draws a new logo, picks its own
orange, hand-writes icons and invents fake login code. All of those already
exist here.

> **To the AI reading this:** you are working on an existing, finished design
> system. Your job is to **reuse what's listed here**, not to create new
> versions of it. If something you need isn't in this guide, **ask the
> developer to paste the file** (paths are given below) before writing code.
> Never invent a logo, colour, icon, button, input, font or API call.

---

## 1. The rules that matter most

1. **Never draw a logo.** Import it:
   `import { Logo } from "@/components/shared/logo"` → `<Logo />`.
2. **Never write a colour value** (`#ff5a26`, `bg-[#161616]`, `text-white`,
   `red-400`, `white/10`). Use the theme tokens (§4): `bg-background`,
   `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`,
   `bg-brand`, `text-destructive`. The brand orange is **`#ff5c35`**, used
   through `bg-brand` / `text-brand-ink`, never typed out.
3. **Never hand-write an SVG icon.** Use
   `<Icon name="eye" />` from `@/components/shared/icon` (names in §6).
4. **Never build your own button or input.** Use
   `Button` from `@/components/ui/button`, and for forms the form system in
   `@/components/forms` (§7).
5. **Never invent auth or data code** ("TODO: plug in NextAuth/Supabase").
   Auth and data already exist in `src/features/*` (§8).
6. **Light and dark must both work.** Never hardcode `text-white` or
   `bg-black`. Tokens switch with the theme automatically.
7. **No outer drop shadows or glows** (`shadow-lg`, `shadow-2xl`, coloured
   glows). Depth comes from surface tones and *inset* shadows (§4).
8. **This is Next.js 16, Tailwind v4, Base UI.** It is not the Next.js,
   Tailwind or Radix you remember. Read §3 before writing code.

---

## 2. What Deplogram is

A lightweight **developer cloud**: connect a GitHub repo, pick a runtime,
get a live URL. It's built in Nigeria (`en_NG`) and operated by REKTINA.

The repo has **two products**:

| Area | URL | Folder | What it is |
|---|---|---|---|
| **Marketing site** | `/`, `/deploy`, `/runtimes`, `/blog`, `/waitlist`… | `src/app/(base)/` | Public pages: hero, features, blog, waitlist. Smooth scroll (Lenis). |
| **Your Galley** (the app) | `/dashboard/...` | `src/app/(app)/dashboard/` | The logged-in product: projects, deployments, logs, metrics, environment variables, usage, activity, settings. |
| Auth pages | `/signin`, `/signout` | `src/app/(app)/signin/`, `src/app/(app)/signout/` | In the app group (so the mock API works) but outside `/dashboard` (no app frame). |

Words: the workspace is always called **"Your Galley"**. Kitchen and food
phrases are **only** used for a few marketing headlines. Everything else
(labels, buttons, errors) is plain technical English. Full product facts:
`docs/product-blueprint.md`.

Deployment states, in order: `QUEUED → BUILDING → BUILT → DEPLOYING →
RUNNING`, failures `BUILD_FAILED`, `DEPLOY_FAILED`, `CRASHED`.

---

## 3. Stack (exact, and what's different)

| Thing | Version / choice | What's different from what an AI expects |
|---|---|---|
| Next.js | **16.3** (App Router, Turbopack) | `params` and `searchParams` are **Promises** (`const { id } = await params`). Pages use the global types `PageProps<"/route">` and `LayoutProps<"/route">`. There is no `pages/` folder. |
| React | 19.2 | — |
| Tailwind CSS | **v4** | **There is no `tailwind.config.js`.** All tokens live in `src/app/globals.css` (`@theme`). Use canonical v4 classes: `bg-linear-to-r`, not `bg-gradient-to-r`; `bg-white/6`, not `bg-white/[0.06]`. |
| UI kit | **shadcn on Base UI** (style `base-vega`) | **Not Radix.** Compose with the `render` prop, **never `asChild`**: `<DropdownMenuTrigger render={<Button variant="ghost" />}>`. |
| Icons | Hugeicons, **only** through `<Icon name="…" />` | No lucide, no inline SVG. |
| Forms | react-hook-form + **Zod 4** | Use `useZodForm` + field components (§7). |
| Data | TanStack Query **v5** + `apiFetch` + Zod | One hook per resource in `src/features/<area>/<area>.ts`. |
| Tables | TanStack Table **v9** | Wrapped by `<DataTable>`; don't use the library directly. |
| Charts | Recharts 3.8 | Wrapped in `src/components/charts`; don't use Recharts directly. |
| Toasts | sonner | Through `notify` (§9), not `toast()` directly. |
| Theme | next-themes, **dark by default** | `class="dark"` on `<html>`. |
| Mock API | MSW | `NEXT_PUBLIC_API_MOCKING=enabled` in `.env.local`. |
| Package manager | **Bun** | `bun install`, `bun dev`, `bunx shadcn add …`. Not npm, pnpm or yarn. |

Path alias: `@/` = `src/`.

---

## 4. Colours, surfaces and type (use these names)

All defined in `src/app/globals.css`. **Use the class names, never raw values.**

### Colour tokens

| Class | Means | Use for |
|---|---|---|
| `bg-background` / `text-foreground` | Page canvas / main text | Pages, normal text |
| `text-muted-foreground` | Secondary text | Labels, hints, timestamps |
| `bg-card` | A card or well | Panels and cards |
| `bg-muted` | Subtle fill | Hover rows, icon tiles, chips |
| `border-border` (often `/70`) | Hairlines | Card edges, dividers |
| `bg-popover` | Floating surfaces | Menus, dialogs |
| `bg-brand` / `text-brand-foreground` | Brand orange `#ff5c35` / text on it (near-black, **not white**) | Rare: the brand accent |
| `text-brand-ink` | Brand orange that's readable as text | Orange text and links |
| `text-success`, `text-destructive` | Green done / red failed | Status only |
| `ring-ring` | Focus ring | Automatic on the shared components |

### Special utilities (already written; just use the class)

| Class | What it does | Where |
|---|---|---|
| `metal-brand` | Brushed-metal orange | The **one** main button per screen (`<Button>` default variant already has it), the active nav edge |
| `surface-raised` | Lighter than its parent + 1px inset highlight | Tiles, chips, table bodies inside a card |
| `surface-sunken` | Darker than its parent + inset shade | Input troughs, tracks, footers |
| `surface-band` | In-between tone | Label column of a settings table |
| `skeleton` | Loading shimmer (via `<Skeleton>`) | Loading states |
| `bg-dot-grid`, `mask-fade-edges` | Dotted texture, soft edge fade | Decorative backgrounds |

The app's depth model goes darkest to lightest: **frame** (sidebar and
header) → **panel** (page) → **well** (`bg-card`, darker than the panel) →
**raised / sunken** inside the well. Every element must differ in tone from
what it sits on.

### Fonts (already loaded, don't import fonts)

| Class | Font | Use |
|---|---|---|
| `font-heading` | Host Grotesk | Headings. **The whole app (`/dashboard`) uses it everywhere.** |
| `font-sans` | Inter Tight | Marketing body text |
| `font-mono` | Geist Mono | Machine values: commit SHAs, URLs, commands, env keys |

### Shape

Buttons and pills are `rounded-full`. Cards are `rounded-xl` / `rounded-2xl`.
Inputs and menus are `rounded-md`. Numbers that update use `tabular-nums`.

---

## 5. Folder map (where to find and put things)

```
src/
  app/
    (base)/            marketing pages (navbar + footer from MarketingShell)
    (app)/dashboard/   Your Galley — every app page; layout adds AppShell + mock API
    (app)/signin/ (app)/signout/   auth pages (mock API, no app frame)
    globals.css        ALL design tokens and utilities
    layout.tsx         root: fonts, theme, providers
  components/
    ui/                shadcn primitives: button, input, dialog, dropdown-menu, select,
                       tabs, table, tooltip, sheet, switch, checkbox, field, label, alert,
                       badge, card, skeleton, spinner, sidebar, command…  (reuse, don't copy)
    shared/            logo, icon, status-dot, segmented, settings-table, pane, copy-button, theme-toggle,
                       container, section-wrapper, eyebrow, badge-pill, node-graph, motion/*
    app-shell/         the app frame: app-shell, page (Page/PageHeader/PageSection),
                       empty-state, error-state, app-loader, page-skeleton, sidebar-nav
    forms/             the form system (useZodForm, Form, TextField, SecretField…)
    feedback/          confirm dialog (useConfirm), notify (toasts), callout
    data-table/        DataTable + toolbar (search, filters, pagination in the URL)
    charts/            Stat, AreaTimeSeries, BarTimeSeries, meters, sparkline…
    log-viewer/        live build/runtime logs
    command-palette/   ⌘K palette
    marketing/         marketing sections: navbar, footer, hero, section-header, faq…
  features/<area>/     data hooks (<area>.ts) + that area's components/
                       auth · account · projects · deployments · deploy · activity · usage · overview · codepad · storage · utilities · apis
  lib/                 api-client (apiFetch), format (dates, money, bytes), site config,
                       navigation registry, motion constants, utils (cn)
  content/             marketing copy as typed data (home.ts, faq.ts, nav.ts, runtimes.ts…)
  mocks/               MSW mock API (handlers.ts + data/) used in development
docs/
  design-system.md           marketing-site design rules
  deplogram-design-system.md how the app UI was designed (tokens, motion, patterns, anti-patterns)
  product-blueprint.md       product facts, naming and tone
```

**Where new code goes:**

| You're making | Put it in |
|---|---|
| A new app page | `src/app/(app)/dashboard/<name>/page.tsx` using `<Page>` + `<PageHeader>` |
| A new marketing page | `src/app/(base)/<name>/page.tsx` |
| Data for an area (fetch, mutate) | `src/features/<area>/<area>.ts` |
| A component used by one area | `src/features/<area>/components/` |
| A component used in several areas | `src/components/shared/` (check it doesn't already exist) |
| Marketing text | `src/content/` |
| A shadcn primitive that's missing | `bunx shadcn add <name>` (lands in `components/ui/`) |

---

## 6. Components to reuse (with real usage)

### Logo (never draw one)

```tsx
import { Logo } from "@/components/shared/logo"

<Logo />                         // mark + "deplogram" wordmark, links to /
<Logo wordmark={false} />        // mark only
<Logo variant="signature" />     // hand-signed wordmark (footer)
```

The mark is the brand's **NodeGraph**: small connected nodes, one lit orange.
Never replace it with a rocket, a cloud or new circles.

### Icon (never write SVG)

```tsx
import { Icon } from "@/components/shared/icon"

<Icon name="eye" />                 // sizes: xs (14) · sm (16, default) · md (20) · lg (24)
<Icon name="arrow-right" size="xs" />
<Icon name="github" className="text-muted-foreground" />
```

Available names: `activity analytics bell book github help home logout
message news shield user users archive arrow-left arrow-right arrow-up
sort-asc sort-desc arrow-up-down arrow-up-right binary braces calendar-clock
check chevron-down chevron-right chevrons-up-down circle-alert circle-x clock
code copy container cpu database eye feather file file-archive file-code
file-text fingerprint folder folder-plus gauge git-branch git-commit hammer
handshake heart-pulse hexagon image key-round layers layout link loader mail
menu minus more moon network package play plug plus qr-code regex refresh undo
rocket save scan-search scroll-text search server settings sparkles sun
terminal trash triangle upload variable webhook workflow wrench x zap`

To add one, add a Hugeicons import to the `icons` map in
`src/components/shared/icon.tsx`. A brand logo nobody else has (for example
Google's "G") is the only allowed exception, as a small component in
`components/shared/`.

### Button

```tsx
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"

<Button>Deploy</Button>                              // default = brushed-metal orange. ONE per screen.
<Button variant="outline">Cancel</Button>            // secondary
<Button variant="ghost" size="icon" aria-label="Close"><Icon name="x" /></Button>
<Button loading={isPending}>Save</Button>            // spinner + disabled, built in
<Link href="/signin" className={buttonVariants({ variant: "outline" })}>Sign in</Link>  // a link that looks like a button
```

Variants: `default` (main action) · `outline` · `ghost` · `secondary` ·
`inverted` (marketing) · `destructive` (opens a delete confirm) · `danger`
(inside a confirm only) · `link`. Sizes: `xs sm default lg icon icon-sm
icon-lg`.

### Page layout in the app

```tsx
import { Page, PageHeader, PageSection } from "@/components/app-shell/page"

export default function UsagePage() {
  return (
    <Page width="wide">                       // default | narrow (forms) | wide | full
      <PageHeader title="Usage & limits" description="One sentence about the page." actions={<Button>…</Button>} />
      <PageSection title="Limits">…</PageSection>
    </Page>
  )
}
```

### States: always handle all four

```tsx
import { Skeleton } from "@/components/ui/skeleton"                 // loading: same shape as the content
import { EmptyState } from "@/components/app-shell/empty-state"      // nothing yet
import { ErrorState } from "@/components/app-shell/error-state"      // failed: <ErrorState onRetry={refetch} />
```

### Status of a deployment

```tsx
import { DeploymentStatus } from "@/features/deployments/components/deployment-status"
<DeploymentStatus state="BUILDING" />          // animated dot + word. Don't build your own.
```

### Others that already exist

`Pane` (a titled well with header actions, `@/components/shared/pane`) · `CopyButton` (`@/components/shared/copy-button`) · `CodeEditor` (Monaco, `@/components/code-editor/code-editor`; `readOnly minimal` for snippets) · `FolderShape` (folder-shaped card) · `useLocalPreference` (remember a choice per device, `@/hooks/use-local-preference`) · `Segmented` (tabs with counts) · `SettingsTable` / `SettingRow` ·
`Callout` (`@/components/feedback`) · `useConfirm` (confirm dialogs) ·
`DataTable` · `LogViewer` · `Stat`, `AreaTimeSeries`, `BarTimeSeries`,
`UsageMeter` (`@/components/charts`) · `StatusDot` · `ThemeToggle` ·
marketing: `Container`, `SectionWrapper`, `SectionHeader`, `PageHeader`,
`Navbar`, `Footer`, `FeatureGrid`, `Faq`, `CtaBand`.

---

## 7. Forms (the one way to build a form)

```tsx
"use client"
import { z } from "zod"
import { Form, FormRootError, TextField, SecretField, useZodForm } from "@/components/forms"
import { Button } from "@/components/ui/button"

const schema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
})

export function SignInForm() {
  const form = useZodForm(schema, { defaultValues: { email: "", password: "" } })
  return (
    <Form form={form} onSubmit={async (values) => { /* call a mutation from src/features/... */ }}>
      <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
      <SecretField control={form.control} name="password" label="Password" autoComplete="current-password" copyable={false} />
      <FormRootError />   {/* shows server errors */}
      <Button type="submit" loading={form.formState.isSubmitting}>Sign in</Button>
    </Form>
  )
}
```

Fields: `TextField`, `TextareaField`, `SecretField` (password or secret with
show/hide), `SelectField`, `SwitchField`, `CheckboxField`, `RadioCardsField`,
`KeyValueField`. Extras: `FormActions`, `UnsavedChangesGuard`,
`useFormDraft`, `applyServerErrors`. A working example of every piece:
`/dashboard/dev/forms` (dev only). A real form to copy:
`src/features/account/components/general-settings.tsx`.

---

## 8. Data, auth and the mock API

### Calling the API

Every call goes through `apiFetch` (`src/lib/api-client.ts`), which sends
the session cookie, sends and receives JSON, and **validates the response
with a Zod schema**. Calls are wrapped in TanStack Query hooks inside
`src/features/<area>/<area>.ts`:

```ts
// src/features/projects/projects.ts (the real code)
export const projectKeys = { all: ["projects"] as const, list: () => [...projectKeys.all, "list"] as const /* … */ }

export const projectsQuery = () =>
  queryOptions({
    queryKey: projectKeys.list(),
    queryFn: () => apiFetch("/v1/projects", { schema: z.array(projectSummarySchema) }),
  })

export function useProjects() {
  return useQuery(projectsQuery())
}
```

Mutations live in the same file (`useMutation`) and invalidate the area's
keys afterwards (`queryClient.invalidateQueries({ queryKey: projectKeys.all })`).

Components call the hook (`const { data, isPending, isError, refetch } = useProjects()`).
They never call `fetch` directly.

### Auth (already built, so don't add NextAuth, Supabase or Clerk)

`src/features/auth/session.ts` provides:

| Hook | Does |
|---|---|
| `useViewer()` | The signed-in user `{ id, name, email, image }`, or `null` |
| `useSignIn()` | `signIn.mutate({ email, password, code? })` → `POST /v1/auth/sign-in` |
| `signInRefusal(error)` | Why a sign-in failed: `"two_factor_required"`, `"invalid_code"` or `"invalid_credentials"` |
| `useSignOut()` | Signs out and clears cached data |

The backend owns the session (a cookie). The sign-in page reads
`?callbackUrl=` and goes there afterwards (the app links to
`/signin?callbackUrl=/dashboard`).

**Auth pages (done, October 2026):**

- `/signin` (`src/features/auth/components/sign-in.tsx`): email and password,
  then a code step when two-factor is on (authenticator code or recovery code).
  Only same-site `callbackUrl`s are followed.
- `/signout` (`src/features/auth/components/sign-out.tsx`).
- There is no sign-up: Deplogram is in early access, so new people go to
  `/waitlist`. The old `/login`, `/signup` and `src/components/auth/*` were
  removed — don't bring them back.
- Google and GitHub sign-in need backend endpoints that don't exist yet. Ask
  before adding buttons that do nothing.
- Password, two-factor and signed-in devices live in Settings › Security
  (`src/features/account/security.ts`).

### Mock API (development)

The real backend is at `https://deplogram-backend.vercel.app` (Swagger UI at
`/api/docs`, raw spec at `/api/docs-json`). It implements the same contract the
frontend's `src/features/*/*.ts` files describe.

`NEXT_PUBLIC_API_MOCKING` picks how much MSW answers in the browser
(`src/mocks/handlers.ts`, data in `src/mocks/data/`):

| Value | What happens |
|---|---|
| `enabled` | Everything is mocked; no backend needed. |
| `partial` | Endpoints in `src/mocks/live-endpoints.ts` go to `NEXT_PUBLIC_API_URL`; the rest (CodePad, Storage, webhooks, APIs pages, security, notifications) stay mocked. When the backend ships an endpoint, add it to that list. |
| unset | Nothing is mocked. |

The backend sends project URLs in full (`https://name.deplogram.app`); the
schemas turn them into hosts with `toHost` (`@/lib/format`). Projects are
served at `<name>.${siteConfig.deployDomain}` — use `siteConfig`, never a
hardcoded domain. **It only runs inside
`src/app/(app)/`** (the `MswProvider` in `src/app/(app)/layout.tsx`), which
is why `/signin` and `/signout` live there. In the mock, any email signs in and
`wrong` is the one wrong password; signing out lasts for the browser tab. A new
endpoint needs a handler in `handlers.ts`.

---

## 9. Feedback and wording

```ts
import { notify, useConfirm, Callout } from "@/components/feedback"

notify.success("Settings saved")                        // short, past tense
notify.error(error)                                     // turns any error into a plain sentence
const confirm = useConfirm()
await confirm({ title: "Delete project?", confirmLabel: "Delete project", tone: "destructive", confirmText: "orders-api" })
```

Wording rules: buttons say the action ("Redeploy", "Delete project", never
"OK" or "Yes"). Titles are plain nouns ("Deployments"). Errors are one calm
sentence plus "Try again". Labels are short; machine values are mono.
Money, dates and sizes use `src/lib/format.ts` (`formatRelativeTime`,
`formatBytes`, `formatCompact`, `formatDuration`).

---

## 10. Motion

Constants live in `src/lib/motion.ts`: one easing `cubic-bezier(0.16, 1, 0.3, 1)`
(class `ease-out-expo`), durations 0.3 / 0.5 / 0.6s. Animate only transform
and opacity. Every animation must stop under `prefers-reduced-motion`
(`motion-reduce:animate-none`). Marketing motion helpers are in
`src/components/shared/motion/` (`FadeInUp`, `StaggerGroup`, `Magnetic`…).
In the app, motion means state (live, building, failed), not decoration.

---

## 11. What went wrong before (don't repeat it)

From the first `/login` attempt, written by an AI without this guide:

| It did | Do instead |
|---|---|
| Drew a new logo with `<circle>`s and `#ff5a26` | `<Logo />` from `@/components/shared/logo` |
| `text-white`, `bg-black`, `bg-[#161616]`, `text-white/50`, `border-white/10`, `text-red-400` | `text-foreground`, `bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `text-destructive` (works in light mode too) |
| `#ff5a26` / `#ff7a4d` orange | `bg-brand`, `text-brand-ink`, `ring-ring` |
| Inline SVGs for eye, arrow, check | `<Icon name="eye" />`, `"arrow-up-right"`, `"check"` |
| Its own `Field`, `PasswordField`, `SubmitButton` | `TextField`, `SecretField` from `@/components/forms`; `<Button loading>` |
| `useState` + `FormData` + "TODO: plug in NextAuth/Supabase" | `useZodForm` + `useSignIn()` from `src/features/auth/session.ts` |
| A second sign-in route (`/login`) next to `/signin` | One route; extend what exists |
| `shadow-2xl`, an orange glow shadow | Inset depth (`surface-raised` / `surface-sunken`) |
| `text-[15px]`, `rounded-[28px]`, `text-[11px]` | The scale: `text-sm`, `text-base`, `rounded-2xl`, `text-xs` |
| `animate-pulse` dots for status | `StatusDot` / `DeploymentStatus` |

---

## 12. How to work with a browser AI (for the developer)

1. **Start every chat by pasting this file.**
2. **Then paste the files your task touches.** Typical sets:

   | Task | Paste |
   |---|---|
   | A new app page | `src/components/app-shell/page.tsx`, a similar existing page, the feature's `<area>.ts` |
   | A form | `src/components/forms/fields.tsx`, `src/features/account/components/general-settings.tsx` |
   | Auth pages | `src/features/auth/components/sign-in.tsx`, `src/features/auth/session.ts` |
   | A marketing section | `src/components/marketing/section-header.tsx`, a similar section, `docs/design-system.md` |
   | Styling questions | the relevant part of `src/app/globals.css` |
   | Anything with data | the feature's `<area>.ts` and `src/mocks/handlers.ts` |

3. **Start your request with:** *"Follow the project guide. Reuse the
   existing components it lists. If you need a file you haven't seen, ask me
   for it instead of writing your own version."*
4. **Before committing, check the AI's code for:** a `#` colour,
   `text-white` / `bg-black`, an `<svg>`, a new `Logo`, a new `Button` /
   `Input`, `asChild`, `tailwind.config`, `npm install`. Any of these means
   it ignored the guide.
5. **Check both themes** (the sun/moon toggle) and a phone width (390px).
6. **Run it:** `bun install`, then `bun dev`, then open
   http://localhost:3000. For the app, set `NEXT_PUBLIC_API_MOCKING=enabled`
   in `.env.local` (copy `.env.example`).
