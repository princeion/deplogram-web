import type { FeatureItem, IconName } from "@/content/types"

/**
 * The five product pillars and the developer workflow they add up to.
 * Source of truth: docs/product-blueprint.md (Product & Pricing Blueprint §2, §12).
 */
export const pillars: readonly (FeatureItem & { href: string })[] = [
  {
    title: "APIs",
    description: "OTP, notifications, SMS, email, image processing, QR codes, validation and more — behind one API key.",
    icon: "plug",
    href: "/#apis",
  },
  {
    title: "Developer utilities",
    description: "JSON, JWT, Base64, regex, cron and webhook tools you can open in seconds. Free on every plan.",
    icon: "wrench",
    href: "/#tools",
  },
  {
    title: "Deployments",
    description: "Push from GitHub and test on a myapp.dpl.app address. Upgrade to keep it running.",
    icon: "git-branch",
    href: "/#deploy",
  },
  {
    title: "Storage",
    description: "Files, assets, backups and app data that survive restarts and redeploys.",
    icon: "database",
    href: "/#storage",
  },
  {
    title: "Domains",
    description: "Search, buy and manage domains, then connect them to any deployment.",
    icon: "globe",
    href: "/#domains",
  },
]

/**
 * Discover utility → use API → deploy → store → connect domain → scale usage (Blueprint §12).
 * Kept in step with NODE_GRAPH_LAYOUTS.workflow in src/lib/node-graph.ts.
 */
export const workflow: readonly FeatureItem[] = [
  {
    title: "Discover a utility",
    description: "Start with the toolbelt — format JSON, decode a JWT, test a regex. No install, no setup.",
    icon: "wrench",
  },
  {
    title: "Use an API",
    description: "Create an API key and send an OTP, an email or a QR code from any stack. A monthly quota is included.",
    icon: "key-round",
  },
  {
    title: "Deploy",
    description: "Push to GitHub. Deplogram detects the framework, builds it and gives you `myapp.dpl.app` to test on.",
    icon: "git-branch",
  },
  {
    title: "Store",
    description: "Keep uploads, assets and backups in storage that lives apart from your containers.",
    icon: "database",
  },
  {
    title: "Connect a domain",
    description: "Buy a domain or bring your own, point it at the deployment, and HTTPS is handled.",
    icon: "globe",
  },
  {
    title: "Scale usage",
    description: "Watch usage in one dashboard. Upgrade for persistent apps and higher limits, or pay as you go beyond your quota.",
    icon: "trending-up",
  },
]

export type ProductPanel = {
  id: string
  eyebrow: string
  title: string
  description: string
  icon: IconName
  points: readonly string[]
}

export const storagePanel: ProductPanel = {
  id: "storage",
  eyebrow: "Storage",
  title: "Storage that outlives your containers.",
  description:
    "Files, assets, backups and application data live in persistent object storage — separate from your app, so a restart or redeploy never touches your data.",
  icon: "database",
  points: ["Files & assets", "Backups", "Application data", "Extra capacity when you need it"],
}

export const domainsPanel: ProductPanel = {
  id: "domains",
  eyebrow: "Domains",
  title: "Find a domain. Connect it in a click.",
  description:
    "Search, buy and manage domains from your dashboard and point them at any deployment. Your free myapp.dpl.app address stays.",
  icon: "globe",
  points: ["Domain search", "Purchase & renewals", "DNS management", "Automatic HTTPS"],
}

// TODO: illustrative previews for the storage/domains panels — swap for real dashboard screenshots later.
export const storagePreview: readonly { path: string; size: string; icon: IconName }[] = [
  { path: "assets/logo.svg", size: "24 KB", icon: "image" },
  { path: "uploads/avatars/ada.webp", size: "86 KB", icon: "image" },
  { path: "exports/orders-2026-09.csv", size: "1.2 MB", icon: "file-text" },
  { path: "backups/db-2026-09-28.sql.gz", size: "48 MB", icon: "archive" },
]

export const domainPreview: {
  query: string
  results: readonly { domain: string; status: "connected" | "available" | "taken" }[]
} = {
  query: "myapp",
  results: [
    { domain: "myapp.dpl.app", status: "connected" },
    { domain: "myapp.ng", status: "available" },
    { domain: "myapp.dev", status: "available" },
    { domain: "myapp.com", status: "taken" },
  ],
}
