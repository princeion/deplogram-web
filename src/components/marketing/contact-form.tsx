"use client"

import * as React from "react"
import { toast } from "sonner"

import { contactTopics, type ContactTopic } from "@/content/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { NodeGraph } from "@/components/shared/node-graph"

// Stubbed submit latency so the loading state is visible. Remove when wired to a real endpoint.
const STUB_DELAY_MS = 1400

/**
 * Contact form — stubbed, no backend yet.
 * TODO: POST to CONTACT_FORM_ENDPOINT (see .env.example) via a Server Action once an email/API provider is chosen.
 */
export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: ContactTopic }) {
  const [pending, setPending] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS))
    setPending(false)
    formRef.current?.reset()
    toast.success("Message received", {
      description: "Thanks — this form is a preview, so nothing was sent yet. Email us directly in the meantime.",
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 rounded-2xl elevation-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" autoComplete="name" required placeholder="Ada Obi" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-email">Work email</Label>
          <Input id="contact-email" name="email" type="email" autoComplete="email" required placeholder="ada@company.com" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-company">Company (optional)</Label>
          <Input id="contact-company" name="company" autoComplete="organization" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-topic">Topic</Label>
          <Select name="topic" items={contactTopics} defaultValue={defaultTopic}>
            <SelectTrigger id="contact-topic" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contactTopics.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="What are you building?"
          className="min-h-32"
          data-lenis-prevent
        />
      </div>
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">We'll get back to you as soon as we can.</p>
        <Button type="submit" size="lg" variant={pending ? "outline" : "inverted"} disabled={pending} aria-busy={pending} className="min-w-36">
          {pending ? (
            <>
              {/* Build-progress motif instead of a generic spinner. */}
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
