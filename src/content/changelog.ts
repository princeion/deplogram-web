export type ChangeType = "new" | "improved" | "fixed"

export type ChangelogEntry = {
  version: string
  /** ISO date, YYYY-MM-DD */
  date: string
  title: string
  summary: string
  changes: readonly { type: ChangeType; text: string }[]
}

// TODO: placeholder release notes — replace with real entries as releases ship. Newest first.
export const changelog: readonly ChangelogEntry[] = [
  {
    version: "0.9.0",
    date: "2026-09-15",
    title: "Preview deployments for every pull request",
    summary: "Open a PR and get a unique URL for that branch, updated on every push and cleaned up on merge.",
    changes: [
      { type: "new", text: "Preview URLs posted as a GitHub check on each pull request." },
      { type: "improved", text: "Deployment history now groups previews under their branch." },
      { type: "fixed", text: "Environment variables scoped to previews no longer leak into production builds." },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-08-28",
    title: "Webhook tester: inspect, retry, replay",
    summary: "Every incoming webhook is captured with headers and body, so you can debug integrations without a tunnel.",
    changes: [
      { type: "new", text: "Replay any captured event against your current deployment." },
      { type: "new", text: "Automatic retries with exponential backoff." },
      { type: "improved", text: "Faster log search across build and runtime logs." },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-08-05",
    title: "Docker runtime",
    summary: "Bring a Dockerfile and Deplogram builds and runs it — the escape hatch for anything we don't detect.",
    changes: [
      { type: "new", text: "Dockerfile detection and multi-stage build support." },
      { type: "improved", text: "Health checks can target a custom path and port." },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-07-14",
    title: "Developer tools: JWT decoder and regex tester",
    summary: "Two of the most-requested developer utilities arrive.",
    changes: [
      { type: "new", text: "JWT decoder with expiry countdown." },
      { type: "new", text: "Regex tester with live match groups." },
      { type: "fixed", text: "JSON → TypeScript now handles arrays of mixed objects." },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-06-20",
    title: "Private beta",
    summary: "The first developers are deploying to dpl.app. Thank you for the feedback so far.",
    changes: [
      { type: "new", text: "Git deployments for Node.js, Next.js, Vite and static sites." },
      { type: "new", text: "Automatic HTTPS and free dpl.app subdomains." },
    ],
  },
]
