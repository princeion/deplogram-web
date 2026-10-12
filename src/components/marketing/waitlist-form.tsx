"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { entrance } from "@/lib/motion"
import { joinWaitlist, type FormState } from "@/lib/actions"
import { waitlistRoles, waitlistRuntimes, type WaitlistSource } from "@/content/waitlist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Icon } from "@/components/shared/icon"
import { NodeGraph } from "@/components/shared/node-graph"

const initialState: FormState = { status: "idle" }

/** A previously submitted value, so fields re-fill after React resets the form on an error. */
function submitted(state: FormState, name: string) {
  const value = state.values?.[name]
  return typeof value === "string" ? value : undefined
}

function wasChecked(state: FormState, name: string, value: string) {
  const current = state.values?.[name]
  return Array.isArray(current) ? current.includes(value) : current === value
}

/** Hidden from people, visible to bots. Filled → the server pretends it worked. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

function Confirmation({ message, className }: { message?: string; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={entrance}
      className={cn("flex items-start gap-3 rounded-2xl elevation-surface p-4", className)}
    >
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <Icon name="check" size="xs" />
      </span>
      <div className="grid gap-0.5">
        <p className="font-medium text-foreground">You&apos;re on the list.</p>
        <p className="text-sm text-muted-foreground">
          {message?.replace("You're on the list. ", "") ?? "We'll email you when your invite is ready."}
        </p>
      </div>
    </motion.div>
  )
}

type WaitlistInlineProps = {
  source: WaitlistSource
  className?: string
  /** Button label. */
  cta?: string
  /** Fine print under the field. */
  note?: string
  /** Brand orange for the one primary conversion on a view; inverted elsewhere. */
  primary?: boolean
}

/** Email + pill button in one pill — CTA banner, pages. */
export function WaitlistInline({ source, className, cta = "Join the waitlist", note, primary = false }: WaitlistInlineProps) {
  const [state, formAction, pending] = React.useActionState(joinWaitlist, initialState)
  const id = React.useId()

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <Confirmation key="done" message={state.message} />
        ) : (
          <motion.form key="form" action={formAction} exit={{ opacity: 0 }} className="relative grid gap-2" noValidate>
            <Honeypot />
            <input type="hidden" name="source" value={source} />
            <Label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </Label>
            <div className="flex items-center gap-1.5 rounded-full elevation-control p-1 focus-within:ring-3 focus-within:ring-ring/50">
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@domain.com"
                defaultValue={submitted(state, "email")}
                aria-invalid={state.errors?.email ? true : undefined}
                aria-describedby={`${id}-msg`}
                className="h-10 min-w-0 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button type="submit" size="lg" variant={primary ? "default" : "inverted"} disabled={pending} aria-busy={pending} className="group shrink-0">
                {pending ? "Saving" : cta}
                <Icon
                  name={pending ? "loader" : "arrow-right"}
                  className={cn("hidden transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 sm:block", pending && "animate-spin")}
                />
              </Button>
            </div>
            {(note || state.status === "error") && (
              <p id={`${id}-msg`} aria-live="polite" className={cn("px-4 text-xs", state.status === "error" ? "text-destructive" : "text-muted-foreground")}>
                {state.status === "error" ? state.message : note}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Pill checkbox / radio built on a native input. */
function Choice({
  type,
  name,
  value,
  label,
  defaultChecked,
}: {
  type: "checkbox" | "radio"
  name: string
  value: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center rounded-full elevation-control px-3.5 py-1.5 text-sm text-muted-foreground transition-colors select-none hover:text-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  )
}

/** The full waitlist form on /waitlist — everything optional except the email. */
export function WaitlistForm({ className }: { className?: string }) {
  const [state, formAction, pending] = React.useActionState(joinWaitlist, initialState)
  const id = React.useId()

  if (state.status === "success") return <Confirmation message={state.message} className={cn("p-6", className)} />

  return (
    <form action={formAction} noValidate className={cn("relative grid gap-6 rounded-2xl elevation-surface p-6 sm:p-8", className)}>
      <Honeypot />
      <input type="hidden" name="source" value="page" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-email`}>
            Email <span className="text-brand-ink">*</span>
          </Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@domain.com"
            defaultValue={submitted(state, "email")}
            aria-invalid={state.errors?.email ? true : undefined}
          />
          {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>Name (optional)</Label>
          <Input id={`${id}-name`} name="name" autoComplete="name" placeholder="Ada Obi" defaultValue={submitted(state, "name")} />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">Which describes you best?</legend>
        <div className="flex flex-wrap gap-2">
          {waitlistRoles.map((role) => (
            <Choice key={role.value} type="radio" name="role" value={role.value} label={role.label} defaultChecked={wasChecked(state, "role", role.value)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">What would you deploy first?</legend>
        <div className="flex flex-wrap gap-2">
          {waitlistRuntimes.map((runtime) => (
            <Choice
              key={runtime.value}
              type="checkbox"
              name="runtimes"
              value={runtime.value}
              label={runtime.label}
              defaultChecked={wasChecked(state, "runtimes", runtime.value)}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-building`}>What are you building? (optional)</Label>
        <Textarea
          id={`${id}-building`}
          name="building"
          rows={3}
          maxLength={500}
          defaultValue={submitted(state, "building")}
          placeholder="A booking API for my cousin's restaurant…"
          className="min-h-24 resize-none"
          data-lenis-prevent
        />
      </div>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className={cn("text-xs", state.status === "error" ? "text-destructive" : "text-muted-foreground")}>
          {state.status === "error" ? state.message : "One email when your invite is ready. No spam."}
        </p>
        <Button type="submit" size="lg" variant={pending ? "outline" : "default"} disabled={pending} aria-busy={pending} className="min-w-44">
          {pending ? (
            <>
              <NodeGraph layout="divider" state="loading" className="w-10" />
              Saving
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
      </div>
    </form>
  )
}
