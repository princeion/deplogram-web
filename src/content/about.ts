import type { FeatureItem } from "@/content/types"

// TODO: the story copy is a draft — replace with the founders' own words.
export const aboutCopy = {
  hero: {
    title: "About *Deplogram.*",
    description:
      "Deplogram is a lightweight developer cloud operated by REKTINA, built for developers who want to go from code to a working deployment without unnecessary complexity.",
  },
  story: {
    title: "A focused developer cloud.",
    paragraphs: [
      "Getting a project into production often means learning a large cloud platform first — consoles, configuration and a catalogue of services most projects never use.",
      "Deplogram takes a narrower approach. Deployment is the core product: connect a repository, choose one of eight supported runtimes, configure only what the deployment needs and watch it go live. Around it sits a compact set of tools — a workspace, an editor, storage, six utilities and four APIs.",
      "The platform is in active development and will open to the waitlist in waves, so each group of users starts on stable infrastructure.",
    ],
  },
  quote: "A simple experience on the surface, backed by reliable deployment infrastructure underneath.",
} as const

/** Product principles (brief §7), written for the public. */
export const principles: readonly FeatureItem[] = [
  {
    title: "Lightweight over bloated",
    description: "A few dependable products instead of a long catalogue of cloud services.",
    icon: "feather",
  },
  {
    title: "Developer clarity",
    description: "Technical controls use familiar, conventional language.",
    icon: "terminal",
  },
  {
    title: "Eight reliable runtimes",
    description: "The supported runtimes are made dependable before coverage is expanded.",
    icon: "layers",
  },
  {
    title: "Complexity stays underneath",
    description: "Builds, containers, routing, logs and health checks are handled by the platform.",
    icon: "server",
  },
  {
    title: "Explicit states",
    description: "A successful build is not reported as a successful deployment. Failures say where they happened.",
    icon: "activity",
  },
  {
    title: "Isolated deployments",
    description: "Every deployment is kept separate and controlled at the infrastructure level.",
    icon: "container",
  },
]
