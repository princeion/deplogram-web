import type { FeatureItem } from "@/content/types"

/**
 * Deployments pillar — headline features rendered as cards on the homepage.
 * Free test deployment → paid persistent deployment is the intended progression (Blueprint §3, §7).
 */
export const deploymentFeatures: readonly FeatureItem[] = [
  {
    title: "Git deployments",
    description: "Connect a GitHub repo once. Every push builds and deploys automatically.",
    icon: "git-branch",
  },
  {
    title: "A dpl.app address",
    description: "Every deployment gets `myapp.dpl.app` with HTTPS — test it and share it straight away.",
    icon: "lock",
  },
  {
    title: "Persistent deployments",
    description: "When it's ready, keep it running: longer-running, private and production-oriented apps on paid plans.",
    icon: "server",
  },
  {
    title: "Background jobs & cron",
    description: "Run workers and scheduled jobs next to your app on Pro, without a second provider.",
    icon: "calendar-clock",
  },
  {
    title: "Instant rollbacks",
    description: "Deploys are immutable. Roll back to any previous version from your deployment history.",
    icon: "rotate-ccw",
  },
  {
    title: "Build + runtime logs",
    description: "Inspect build output and runtime logs on every plan, with advanced logs on Pro.",
    icon: "scroll-text",
  },
]

/** The rest of the deployments pillar — rendered as a pill row under the matrix. */
export const deploymentExtras: readonly string[] = [
  "Framework auto-detection",
  "Environment variables",
  "Preview deployments",
  "Private deployments",
  "Deployment history",
  "Health checks",
]
