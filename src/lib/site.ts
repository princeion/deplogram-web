/** Site-wide constants. Swap URLs here, not in components. */
export const siteConfig = {
  name: "Deplogram",
  /** The company Deplogram operates under. */
  operator: "REKTINA",
  /** Hero line — the brand personality (see docs/product-blueprint.md "Brand"). */
  tagline: "Cuisine a masterpiece with ease.",
  positioning: "The lightweight developer cloud.",
  description:
    "Build, deploy and run your apps on one lightweight developer cloud. Connect a GitHub repository, pick one of eight runtimes and get a live URL — with a code editor, storage, utilities and APIs in one workspace. Early access opens soon.",
  /** Search terms the site is written around — used for the keywords meta tag. */
  keywords: [
    "developer cloud",
    "deploy web apps",
    "app hosting",
    "deploy from GitHub",
    "Next.js hosting",
    "Node.js hosting",
    "Python hosting",
    "PHP hosting",
    "Go hosting",
    "Docker deployment",
    "static site hosting",
    "online code editor",
    "developer APIs",
    "platform as a service",
    "PaaS Africa",
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://deplogram.app",
  /** Example deployment address shown in product mocks, e.g. myapp.dpl.app. */
  deployDomain: "dpl.app",
  /** Every "get started" CTA goes here until the product opens. */
  waitlistUrl: "/waitlist",
  // TODO: replace with real inboxes before launch.
  emails: {
    hello: "hello@deplogram.app",
    sales: "sales@deplogram.app",
    support: "support@deplogram.app",
  },
} as const
