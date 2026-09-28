import type { FeatureItem } from "@/content/types"

export const values: readonly FeatureItem[] = [
  {
    title: "Developers first",
    description: "If a default makes developers think, we haven't finished designing it.",
    icon: "code",
  },
  {
    title: "Ship small, ship often",
    description: "We practise what the product preaches: small changes, deployed continuously, rolled back without drama.",
    icon: "refresh-cw",
  },
  {
    title: "Built for Africa, ready for anywhere",
    description: "Local realities — payments, SMS, connectivity — are first-class requirements, not edge cases.",
    icon: "map-pin",
  },
  {
    title: "Own the outcome",
    description: "Every person on the team can take an idea from a conversation to production.",
    icon: "handshake",
  },
]

export type TeamMember = {
  name: string
  role: string
  /** TODO: add real photos under /public/team and render them with next/image. */
  image?: string
}

// TODO: replace with the real team (names, roles and photos) before launch.
export const team: readonly TeamMember[] = [
  { name: "Team Member", role: "Co-founder · Engineering" },
  { name: "Team Member", role: "Co-founder · Product" },
  { name: "Team Member", role: "Infrastructure" },
  { name: "Team Member", role: "Developer Experience" },
]

export type Role = {
  title: string
  team: string
  location: string
  type: string
}

// TODO: placeholder roles — replace with real openings (and link each to its application page).
export const roles: readonly Role[] = [
  { title: "Senior Platform Engineer", team: "Infrastructure", location: "Lagos / Remote (Africa)", type: "Full-time" },
  { title: "Site Reliability Engineer", team: "Infrastructure", location: "Remote (Africa)", type: "Full-time" },
  { title: "Frontend Engineer, Dashboard", team: "Product", location: "Lagos / Remote (Africa)", type: "Full-time" },
  { title: "Developer Advocate", team: "Developer Experience", location: "Remote (Africa)", type: "Full-time" },
]

// TODO: confirm culture/benefit claims with the team before publishing.
export const culture: readonly FeatureItem[] = [
  {
    title: "Remote across Africa",
    description: "We hire where great engineers live and meet in person when it counts.",
    icon: "globe",
  },
  {
    title: "Real ownership",
    description: "Small team, big surface area. You'll own systems, not tickets.",
    icon: "layers",
  },
  {
    title: "Learning built in",
    description: "Time to learn is part of the job — reading, conferences and open-source contributions.",
    icon: "graduation-cap",
  },
]
