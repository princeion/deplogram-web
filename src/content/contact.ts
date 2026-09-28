import { siteConfig } from "@/lib/site"
import type { IconName } from "@/content/types"

export const contactTopics = [
  { value: "general", label: "General question" },
  { value: "sales", label: "Sales" },
  { value: "enterprise", label: "Enterprise" },
  { value: "domains", label: "Domains" },
  { value: "support", label: "Support" },
  { value: "careers", label: "Careers" },
  { value: "press", label: "Press" },
] as const

export type ContactTopic = (typeof contactTopics)[number]["value"]

export function isContactTopic(value: unknown): value is ContactTopic {
  return contactTopics.some((topic) => topic.value === value)
}

export const contactChannels: readonly { title: string; description: string; email: string; icon: IconName }[] = [
  {
    title: "Sales & partnerships",
    description: "Enterprise plans, partnerships and custom infrastructure.",
    email: siteConfig.emails.sales,
    icon: "handshake",
  },
  {
    title: "Support",
    description: "Help with the APIs, deployments, storage or domains.",
    email: siteConfig.emails.support,
    icon: "heart-pulse",
  },
  {
    title: "Careers",
    description: "Questions about a role or working with us.",
    email: siteConfig.emails.careers,
    icon: "users",
  },
]
