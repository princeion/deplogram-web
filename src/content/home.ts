/** Homepage section copy. Lists (pillars, APIs, tools…) live in their own content files. */
export const homeCopy = {
  hero: {
    announcement: {
      label: "Deplogram is in early access",
      cta: "Read the announcement",
      href: "/blog/introducing-deplogram",
    },
    headline: "Build. Deploy.\nStore. Connect.",
    highlight: ["Connect."],
    description:
      "Developer infrastructure, APIs and utilities in one account — from your first API key to a live app on myapp.dpl.app.",
    points: ["One account", "Free to start", "Pay as you grow"],
  },
  runtimes: {
    eyebrow: "Deploy what you already write — 8 runtimes supported",
  },
  platform: {
    eyebrow: "The platform",
    title: "Everything between your code and your users.",
    description:
      "Five building blocks you'd otherwise assemble from five vendors — each with its own dashboard, keys and bill.",
  },
  workflow: {
    eyebrow: "How it works",
    title: "Discover → use → deploy → store → connect.",
    description:
      "Start with a free utility, grow into the APIs, deploy when you're ready, and scale your usage from the same account.",
  },
  apis: {
    eyebrow: "8 built-in APIs",
    title: "The services every app ends up needing.",
    description:
      "Every API is on Freebies with a monthly quota included. Go beyond it and you pay only for what you use.",
  },
  tools: {
    eyebrow: "12 developer utilities",
    title: "The utilities you open ten times a day.",
    description: "Fast, no-install tools for the small jobs between commits — free on every plan. Try three of them right here.",
  },
  demo: {
    eyebrow: "Deployments",
    title: "Push code. Test it on dpl.app.",
    description:
      "One push, start to finish: framework detection, build, env vars, domain and SSL — then a live address to test and share.",
  },
  deploy: {
    eyebrow: "Test first, then persist",
    title: "Free to test. Ready to keep running.",
    description:
      "Every plan deploys to myapp.dpl.app with basic logs. Paid plans add longer-running, private and persistent deployments with background jobs and cron.",
  },
  cta: {
    title: "Start free. Grow into it.",
    description:
      "Freebies includes the core APIs, every utility, test deployments on myapp.dpl.app and a small storage allowance.",
  },
} as const
