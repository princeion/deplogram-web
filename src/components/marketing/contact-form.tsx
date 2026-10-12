"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { sendContactMessage, type FormState } from "@/lib/actions"
import { contactTopics, type ContactTopic } from "@/content/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Icon } from "@/components/shared/icon"
import { NodeGraph } from "@/components/shared/node-graph"

const initialState: FormState = { status: "idle" }

/** Contact form — a Server Action posts to CONTACT_FORM_ENDPOINT (see .env.example). */
export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: ContactTopic }) {
  const [state, formAction, pending] = React.useActionState(sendContactMessage, initialState)

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-2xl elevation-surface p-6 sm:p-8">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Icon name="check" />
        </span>
        <p className="font-heading text-subheading font-semibold">Message received.</p>
        <p className="text-muted-foreground">{state.message}</p>
      </div>
    )
  }

  const error = (name: string) => state.errors?.[name]
  // React resets the form after an action; re-fill from what was submitted when it comes back with errors.
  const value = (name: string) => {
    const v = state.values?.[name]
    return typeof v === "string" ? v : undefined
  }
  const topic = value("topic") ?? defaultTopic

  return (
    <form action={formAction} noValidate className="relative grid gap-5 rounded-2xl elevation-surface p-6 sm:p-8">
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={error("name")}>
          <Input id="contact-name" name="name" autoComplete="name" required placeholder="Ada Obi" defaultValue={value("name")} aria-invalid={error("name") ? true : undefined} />
        </Field>
        <Field id="contact-email" label="Email" error={error("email")}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ada@company.com"
            defaultValue={value("email")}
            aria-invalid={error("email") ? true : undefined}
          />
        </Field>
      </div>
      <Field id="contact-topic" label="Topic">
        <Select key={topic} name="topic" items={contactTopics} defaultValue={topic}>
          <SelectTrigger id="contact-topic" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contactTopics.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="contact-message" label="Message" error={error("message")}>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="What are you building?"
          className="min-h-32"
          defaultValue={value("message")}
          aria-invalid={error("message") ? true : undefined}
          data-lenis-prevent
        />
      </Field>
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className={cn("text-xs", state.status === "error" ? "text-destructive" : "text-muted-foreground")}>
          {state.status === "error" ? state.message : "A person reads every message."}
        </p>
        <Button type="submit" size="lg" variant={pending ? "outline" : "inverted"} disabled={pending} aria-busy={pending} className="min-w-36">
          {pending ? (
            <>
              <NodeGraph layout="divider" state="loading" className="w-10" />
              Sending
            </>
          ) : (
            "Send message"
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
