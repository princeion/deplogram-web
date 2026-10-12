import { siteConfig } from "@/lib/site"
import type { IconName } from "@/content/types"

export const contactTopics = [
  { value: "general", label: "General question" },
  { value: "early-access", label: "Early access" },
  { value: "enterprise", label: "Enterprise" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press" },
] as const

export type ContactTopic = (typeof contactTopics)[number]["value"]

export function isContactTopic(value: unknown): value is ContactTopic {
  return contactTopics.some((topic) => topic.value === value)
}

export const contactChannels: readonly { title: string; description: string; email: string; icon: IconName }[] = [
  {
    title: "Hello",
    description: "Questions about Deplogram or early access.",
    email: siteConfig.emails.hello,
    icon: "mail",
  },
  {
    title: "Enterprise & partnerships",
    description: "Custom resources, limits and infrastructure.",
    email: siteConfig.emails.sales,
    icon: "handshake",
  },
]
