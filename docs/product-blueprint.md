# Deplogram — Product & Technical Brief (summary)

Source of truth for marketing copy and site structure. Summarised from the *Deplogram Product &
Technical Alignment Brief* (received 2026-10). When copy in `src/content/` disagrees with this file,
this file wins — update the copy, or update this file if the product direction has changed.

## Definition

A **lightweight developer cloud** focused on deployment, development utilities, APIs, storage and a
clean developer workspace. Operated by REKTINA. Not positioned as a giant cloud provider, and not a
general-purpose website host — deployment is the core.

## MVP surface

| Area | Scope |
|---|---|
| Deployment | Core product. Flow: source → runtime → configure → deploy → live |
| Runtimes (8) | Vite, Next.js, Node.js, Python, PHP, Go, Static Sites, Docker — make these reliable before adding more |
| Galley | The workspace ("Your Galley"): Projects, Deployments, CodePad, Storage, Utilities, APIs, Settings |
| CodePad | In-browser editor, open-source editor foundation (likely Monaco). Run, Save, Deploy, Preview |
| Storage | Simple file/object storage: usage, folders, upload, new folder, search, sort, delete |
| Utilities | 6 (exact list to confirm — see TODO in `src/content/tools.ts`) |
| APIs | 4 (exact list to confirm) |

**Removed from MVP:** domains, the former 12-utility / 8-API scope.

## Deployment lifecycle

`QUEUED → BUILDING → BUILT → DEPLOYING → RUNNING`, with explicit failures `BUILD_FAILED`,
`DEPLOY_FAILED`, `CRASHED`. A successful build is not a running deployment. Runtime configuration
exposes only: runtime version, build command, start command, port, environment variables.

## Brand & tone

Brand lines (brief §2), used **only** as these headers:

| Area | Line |
|---|---|
| Hero | Cuisine a masterpiece with ease |
| Deploy | Serve and test your work seamlessly. |
| Galley | Your Galley (workspace name only) |
| CodePad | Your exquisite code utensil for your craftsmanship. |
| Storage | Finished your craft? Now refrigerate. |
| Utilities & APIs | The right condiments for your code recipe. |

Everything else on the site is plain, serious, technical language — no further food/cooking
metaphors in body copy, labels, statuses, sample data or UI.

## Site status (Oct 2026)

The product is an MVP in development. The site collects a **waitlist** and shows an honest
**roadmap**. **No pricing is published** — plans and prices are not shown until the team decides to.

## Infrastructure (internal — not marketed)

Infrastructure is being aligned with a partner arrangement; costs and vendors are not named on the site.
