/** Site-wide constants. Swap URLs here, not in components. */
export const siteConfig = {
  name: "Deplogram",
  /** The company Deplogram operates under. */
  operator: "REKTINA",
  /** Hero line — the brand personality (see docs/product-blueprint.md "Brand"). */
  tagline: "Cuisine a masterpiece with ease.",
  positioning: "The lightweight developer cloud.",
  description:
    "Deplogram is a lightweight developer cloud: deploy across eight runtimes, write code in CodePad, keep files in storage and reach for six utilities and four APIs — all from one workspace. Early access opens soon.",
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
