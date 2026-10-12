/**
 * Homepage section copy. Lists (runtimes, tools, roadmap…) live in their own content files.
 * Section titles for Deploy, CodePad, Storage and Utilities & APIs, and the hero line, are the brand
 * lines defined in the product brief §2 — everything else stays plain and technical.
 * `*word*` in a title renders in the brand ink.
 */
export const homeCopy = {
  hero: {
    announcement: {
      label: "Deplogram is in development — early access opens in waves",
      cta: "Join the waitlist",
      href: "/waitlist",
    },
    headline: "Cuisine a masterpiece\n*with ease.*",
    description:
      "Deplogram is a lightweight developer cloud. Connect a repository, pick a runtime and get a running deployment — with a workspace, an editor, storage, utilities and APIs in one place.",
    points: ["8 runtimes", "One workspace", "Early access"],
  },
  runtimes: {
    eyebrow: "Vite · Next.js · Node.js · Python · PHP · Go · Static Sites · Docker",
  },
  console: {
    eyebrow: "Deployment",
    title: "From push to *RUNNING.*",
    description: "Every deployment moves through explicit states, with build and runtime logs alongside and a deployment URL at the end.",
  },
  platform: {
    eyebrow: "The platform",
    title: "Deployment at the core. *A focused toolkit around it.*",
    description: "Deplogram is deliberately lightweight: a small set of dependable products instead of a long catalogue of cloud services.",
  },
  deploy: {
    eyebrow: "Deploy",
    title: "Serve and test your work *seamlessly.*",
    description: "Source, runtime, configuration, deployment, live. The interface stays simple while the platform handles builds, containers, routing and health checks.",
  },
  lifecycle: {
    eyebrow: "Deployment lifecycle",
    title: "A successful build is not a running deployment.",
    description:
      "Deployments move through QUEUED, BUILDING, BUILT, DEPLOYING and RUNNING, with explicit failure states so you always know which stage needs attention.",
  },
  galley: {
    eyebrow: "Your Galley",
    title: "One workspace for every project.",
    description: "Projects, deployments, CodePad, storage, utilities, APIs and settings — with projects and deployments first.",
  },
  codepad: {
    eyebrow: "CodePad",
    title: "Your exquisite code utensil for your *craftsmanship.*",
    description: "An in-browser editor built on an open-source editor foundation. Run, save, preview and deploy without leaving your workspace.",
  },
  storage: {
    eyebrow: "Storage",
    title: "Finished your craft? Now *refrigerate.*",
    description: "Developer-oriented file and object storage beside your projects: usage, folders, upload, search, sort and deletion.",
  },
  tools: {
    eyebrow: "Utilities & APIs",
    title: "The right condiments for your *code recipe.*",
    description: "Six developer utilities and four APIs that complement your projects. A small set, chosen for everyday use.",
  },
  principles: {
    eyebrow: "Principles",
    title: "Built to be dependable.",
    description: "The decisions behind the product — and the things we deliberately left out.",
  },
  roadmap: {
    eyebrow: "Roadmap",
    title: "Where Deplogram is today.",
    description: "Deplogram is an MVP in active development. Here's the current status, without dates we haven't committed to.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
  },
  cta: {
    title: "Get early access to Deplogram.",
    description: "Early access opens in waves. Join the waitlist and we'll email you when your invite is ready.",
  },
} as const
