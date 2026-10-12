import { runtimes } from "@/content/runtimes"

export const waitlistRoles = [
  { value: "student", label: "Student" },
  { value: "freelancer", label: "Freelancer" },
  { value: "indie", label: "Indie builder" },
  { value: "team", label: "Part of a team" },
  { value: "other", label: "Something else" },
] as const

export type WaitlistRole = (typeof waitlistRoles)[number]["value"]

export const waitlistRuntimes = runtimes.map((r) => ({ value: r.id, label: r.name }))

/** Where a sign-up came from — sent with the entry so we know which CTA works. */
export type WaitlistSource = "hero" | "cta" | "footer" | "page"

export const waitlistPerks: readonly { title: string; description: string }[] = [
  { title: "An early invite", description: "Early access opens in waves. The waitlist goes first." },
  { title: "Help shape it", description: "Early users get a direct line to the people building it." },
  { title: "One email", description: "We'll email you once, when your invite is ready." },
]
