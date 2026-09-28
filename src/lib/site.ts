/** Site-wide constants. Swap URLs here, not in components. */
export const siteConfig = {
  name: "Deplogram",
  /** The company Deplogram operates under. */
  operator: "REKTINA",
  tagline: "Build. Deploy. Store. Connect.",
  positioning: "Developer infrastructure, APIs & utilities.",
  description:
    "Deplogram is a developer platform: APIs, developer utilities, storage, domains and app deployments from one account. Start free, test on myapp.dpl.app, and pay for what you use as you grow.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://deplogram.app",
  /** Free subdomain every deploy gets, e.g. myapp.dpl.app */
  deployDomain: "dpl.app",
  // TODO: point at https://app.deplogram.app once the app's home (separate project vs. (app) group) is decided.
  appUrl: "/dashboard",
  // TODO: replace with real inboxes before launch.
  emails: {
    hello: "hello@deplogram.app",
    sales: "sales@deplogram.app",
    support: "support@deplogram.app",
    careers: "careers@deplogram.app",
  },
} as const
