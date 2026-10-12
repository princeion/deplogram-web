"use server"

import { siteConfig } from "@/lib/site"
import { isContactTopic } from "@/content/contact"
import { waitlistRoles, waitlistRuntimes, type WaitlistSource } from "@/content/waitlist"

export type FormState = {
  status: "idle" | "success" | "error"
  message?: string
  /** Field name → error, for aria-invalid + inline messages. */
  errors?: Partial<Record<string, string>>
  /** What was submitted — React resets the form after an action, so fields re-fill from this on error. */
  values?: Partial<Record<string, string | string[]>>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOURCES: readonly WaitlistSource[] = ["hero", "cta", "footer", "page"]

function text(formData: FormData, name: string, max: number) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

/**
 * Forwards a submission as JSON to a webhook (Zapier, Make, a Google Apps Script, Formspree, Slack…).
 * Without one configured, development logs the entry and succeeds; production fails honestly.
 */
async function deliver(endpoint: string | undefined, payload: Record<string, unknown>): Promise<boolean> {
  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[forms] no endpoint configured — submission not stored:", payload)
      return true
    }
    console.error(`[forms] no endpoint configured for "${payload.type}" submissions`)
    return false
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) console.error(`[forms] ${payload.type} webhook responded ${response.status}`)
    return response.ok
  } catch (error) {
    console.error(`[forms] ${payload.type} webhook failed`, error)
    return false
  }
}

const deliveryError = `We couldn't save that just now. Try again in a minute, or email ${siteConfig.emails.hello}.`

export async function joinWaitlist(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real people never see this field. Pretend it worked.
  if (text(formData, "company_website", 200)) return { status: "success" }

  const email = text(formData, "email", 254).toLowerCase()
  const role = text(formData, "role", 40)
  const runtimeIds = new Set(waitlistRuntimes.map((r) => r.value))
  const runtimes = formData.getAll("runtimes").filter((r): r is string => typeof r === "string" && runtimeIds.has(r))
  const source = text(formData, "source", 20) as WaitlistSource
  const values = { email, name: text(formData, "name", 100), role, runtimes, building: text(formData, "building", 500) }

  if (!EMAIL.test(email)) {
    return { status: "error", message: "That email doesn't look right.", errors: { email: "Enter a valid email address." }, values }
  }

  const ok = await deliver(process.env.WAITLIST_WEBHOOK_URL, {
    type: "waitlist",
    email,
    name: values.name || undefined,
    role: waitlistRoles.some((r) => r.value === role) ? role : undefined,
    runtimes,
    building: values.building || undefined,
    source: SOURCES.includes(source) ? source : "page",
    submittedAt: new Date().toISOString(),
  })

  return ok
    ? { status: "success", message: "You're on the list. We'll email you when your invite is ready." }
    : { status: "error", message: deliveryError, values }
}

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (text(formData, "company_website", 200)) return { status: "success" }

  const name = text(formData, "name", 100)
  const email = text(formData, "email", 254).toLowerCase()
  const message = text(formData, "message", 4000)
  const topic = text(formData, "topic", 40)

  const values = { name, email, message, topic }
  const errors: FormState["errors"] = {}
  if (!name) errors.name = "Tell us your name."
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address."
  if (message.length < 10) errors.message = "A little more detail, please."
  if (Object.keys(errors).length) return { status: "error", message: "Check the highlighted fields.", errors, values }

  const ok = await deliver(process.env.CONTACT_FORM_ENDPOINT, {
    type: "contact",
    name,
    email,
    topic: isContactTopic(topic) ? topic : "general",
    message,
    submittedAt: new Date().toISOString(),
  })

  return ok
    ? { status: "success", message: "Thanks — your message is in. A person will reply soon." }
    : { status: "error", message: deliveryError, values }
}
