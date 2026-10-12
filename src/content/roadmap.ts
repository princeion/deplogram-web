export type RoadmapStatus = "done" | "now" | "next" | "later"

export const roadmapStatusLabel: Record<RoadmapStatus, string> = {
  done: "Complete",
  now: "In progress",
  next: "Up next",
  later: "Later",
}

export type RoadmapPhase = {
  phase: string
  name: string
  title: string
  status: RoadmapStatus
  description: string
  items: readonly string[]
}

// Honest status only. Brief: frontend largely established; backend/infrastructure being aligned.
// TODO: update statuses as work lands — never publish dates the team hasn't committed to.
export const roadmap: readonly RoadmapPhase[] = [
  {
    phase: "01",
    name: "Foundation",
    title: "Product direction & design",
    status: "done",
    description: "The MVP scope is defined and the core experience is designed.",
    items: ["Scope: deployment, Galley, CodePad, storage, 6 utilities, 4 APIs", "Deploy flow and workspace designed", "Eight supported runtimes selected"],
  },
  {
    phase: "02",
    name: "Platform",
    title: "Building the platform",
    status: "now",
    description: "The deployment infrastructure: builders, containers, routing, logs and health checks behind a simple deploy flow.",
    items: [
      "Deploy engine and lifecycle (QUEUED → RUNNING)",
      "Reliable builds and runs for all eight runtimes",
      "Your Galley, CodePad and storage",
      "Infrastructure alignment",
    ],
  },
  {
    phase: "03",
    name: "Early access",
    title: "Private early access",
    status: "next",
    description: "Invites go to the waitlist in waves, so each group starts on a stable platform.",
    items: ["Invites from the waitlist, in waves", "Usage limits in place", "Direct feedback from early users"],
  },
  {
    phase: "04",
    name: "Launch",
    title: "Public launch",
    status: "later",
    description: "Open sign-ups once the platform has proven itself with early users.",
    items: ["Open sign-ups", "Full documentation", "Status page"],
  },
]

/** Not in the first release — stated plainly. */
export const notYet: readonly string[] = [
  "Custom domains",
  "Runtimes beyond the supported eight",
  "General-purpose website hosting (cPanel, WordPress)",
]
