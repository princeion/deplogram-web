import { siteConfig } from "@/lib/site"
import type { FeatureItem } from "@/content/types"

// Source: Product & Pricing Blueprint §4–§8 (docs/product-blueprint.md).
// TODO: the blueprint gives launch price *ranges* — Plus ₦2,500–₦3,500 and Pro ₦7,500–₦12,500 per month.
// The lower bound is shown until the team confirms final prices; exact quotas per plan are not decided yet.

export type Plan = {
  id: "freebies" | "plus" | "pro" | "enterprise"
  name: string
  /** Who the plan is for, shown under the name. */
  position: string
  /** Display price, or null for "Custom". */
  price: string | null
  cadence?: string
  description: string
  cta: { label: string; href: string }
  highlighted?: boolean
  features: readonly string[]
}

export const plans: readonly Plan[] = [
  {
    id: "freebies",
    name: "Freebies",
    position: "Explore Deplogram",
    price: "₦0",
    cadence: "forever",
    description: "For learning, testing, the utilities and your first deployments.",
    cta: { label: "Start for free", href: siteConfig.appUrl },
    features: [
      "Core APIs with a monthly quota",
      "Every developer utility",
      "Limited test deployments on dpl.app",
      "Small storage allowance",
      "API keys + usage dashboard",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    position: "Individual developers",
    price: "₦2,500",
    cadence: "per month",
    description: "For developers who've outgrown the free limits.",
    cta: { label: "Get Plus", href: siteConfig.appUrl },
    features: [
      "Everything in Freebies",
      "Higher API limits",
      "More storage",
      "Longer-running deployments",
      "Private deployments",
      "Expanded utilities",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    position: "Developers & startups",
    price: "₦7,500",
    cadence: "per month",
    description: "For production-oriented apps and small startups.",
    cta: { label: "Get Pro", href: siteConfig.appUrl },
    highlighted: true,
    features: [
      "Everything in Plus",
      "Higher limits across every API",
      "Persistent deployments",
      "Larger storage",
      "Background jobs + cron",
      "Advanced logs",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    position: "Organizations",
    price: null,
    description: "Dedicated or specialized infrastructure, shaped around your requirements.",
    cta: { label: "Talk to sales", href: "/contact?topic=enterprise" },
    features: [
      "Custom infrastructure + limits",
      "Custom storage + networking",
      "SLA",
      "SSO + audit logs",
      "Dedicated support",
    ],
  },
]

export type ComparisonValue = boolean | string

export type ComparisonRow = {
  feature: string
  values: Record<Plan["id"], ComparisonValue>
}

export type ComparisonGroup = {
  title: string
  rows: readonly ComparisonRow[]
}

// TODO: confirm the qualitative limits ("Higher", "Larger") and replace them with real quotas once set.
export const comparison: readonly ComparisonGroup[] = [
  {
    title: "APIs & utilities",
    rows: [
      { feature: "Core APIs", values: { freebies: true, plus: true, pro: true, enterprise: true } },
      { feature: "API limits", values: { freebies: "Included quota", plus: "Higher", pro: "Higher", enterprise: "Custom" } },
      { feature: "Usage beyond quota", values: { freebies: "Pay as you go", plus: "Pay as you go", pro: "Pay as you go", enterprise: "Custom" } },
      { feature: "API keys + usage dashboard", values: { freebies: true, plus: true, pro: true, enterprise: true } },
      { feature: "Developer utilities", values: { freebies: "Core", plus: "Expanded", pro: "Expanded", enterprise: "Expanded" } },
    ],
  },
  {
    title: "Deployments",
    rows: [
      { feature: "Test deployments on dpl.app", values: { freebies: "Limited", plus: true, pro: true, enterprise: true } },
      { feature: "Longer-running deployments", values: { freebies: false, plus: true, pro: true, enterprise: true } },
      { feature: "Private deployments", values: { freebies: false, plus: true, pro: true, enterprise: true } },
      { feature: "Persistent deployments", values: { freebies: false, plus: false, pro: true, enterprise: true } },
      { feature: "Background jobs + cron", values: { freebies: false, plus: false, pro: true, enterprise: true } },
      { feature: "Logs", values: { freebies: "Basic", plus: "Basic", pro: "Advanced", enterprise: "Advanced" } },
      { feature: "Dedicated infrastructure", values: { freebies: false, plus: false, pro: false, enterprise: true } },
    ],
  },
  {
    title: "Storage & domains",
    rows: [
      { feature: "Storage", values: { freebies: "Small", plus: "More", pro: "Larger", enterprise: "Custom" } },
      { feature: "Extra storage capacity", values: { freebies: false, plus: "Add-on", pro: "Add-on", enterprise: "Custom" } },
      { feature: "Free myapp.dpl.app address", values: { freebies: true, plus: true, pro: true, enterprise: true } },
      { feature: "Buy + connect custom domains", values: { freebies: true, plus: true, pro: true, enterprise: true } },
    ],
  },
  {
    title: "Enterprise",
    rows: [
      { feature: "SSO", values: { freebies: false, plus: false, pro: false, enterprise: true } },
      { feature: "Audit logs", values: { freebies: false, plus: false, pro: false, enterprise: true } },
      { feature: "SLA", values: { freebies: false, plus: false, pro: false, enterprise: true } },
      { feature: "Custom networking", values: { freebies: false, plus: false, pro: false, enterprise: true } },
      { feature: "Dedicated support", values: { freebies: false, plus: false, pro: false, enterprise: true } },
    ],
  },
]

/** How the bill is made up — subscriptions, included quotas and pay-as-you-go (Blueprint §4, §6, §11). */
export const billingModel: readonly FeatureItem[] = [
  {
    title: "Free to start",
    description: "Most APIs and every utility are on Freebies. You only pay once you need more.",
    icon: "sparkles",
  },
  {
    title: "Quotas included",
    description: "Each API comes with a monthly request allowance on every plan. Higher plans include more.",
    icon: "gauge",
  },
  {
    title: "Pay as you grow",
    description: "Past your quota, usage is billed per additional 1,000 requests, at rates tied to what the service actually costs to run.",
    icon: "trending-up",
  },
]

/** Services metered by usage beyond what a plan includes. */
export const meteredServices: readonly string[] = [
  "API calls",
  "Image & file processing",
  "SMS & email delivery",
  "Storage capacity",
  "Bandwidth",
  "Domain registrations + renewals",
]
