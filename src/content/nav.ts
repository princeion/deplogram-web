import type { NavGroup, NavLink } from "@/content/types"

export const productMenu: readonly NavLink[] = [
  {
    label: "APIs",
    href: "/#apis",
    description: "OTP, notifications, SMS, email, images, QR codes and validation.",
    icon: "plug",
  },
  {
    label: "Developer utilities",
    href: "/#tools",
    description: "JSON, JWT, regex, cron and webhook tools — no install.",
    icon: "wrench",
  },
  {
    label: "Deployments",
    href: "/#deploy",
    description: "Test on myapp.dpl.app, then keep it running with persistent deploys.",
    icon: "git-branch",
  },
  {
    label: "Storage",
    href: "/#storage",
    description: "Files, assets and backups that survive every redeploy.",
    icon: "database",
  },
  {
    label: "Domains",
    href: "/#domains",
    description: "Search, buy and connect domains to any deployment.",
    icon: "globe",
  },
]

export const mainNav: readonly NavLink[] = [
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
  { label: "Blog", href: "/blog" },
]

export const footerNav: readonly NavGroup[] = [
  {
    title: "Product",
    links: [
      { label: "APIs", href: "/#apis" },
      { label: "Developer utilities", href: "/#tools" },
      { label: "Deployments", href: "/#deploy" },
      { label: "Storage", href: "/#storage" },
      { label: "Domains", href: "/#domains" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Getting started", href: "/docs/getting-started" },
      { label: "Deploy your first project", href: "/docs/deploying-your-first-project" },
      { label: "Changelog", href: "/changelog" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
    ],
  },
]
