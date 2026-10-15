"use client"

import * as React from "react"
import { useWatch, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"

export type WizardStep<T extends FieldValues> = {
  id: string
  title: string
  description?: string
  /** The fields this step owns — validated (against the form's one schema) before moving on. */
  fields?: readonly FieldPath<T>[]
  /** Skip this step unless it returns true for the current values. */
  when?: (values: T) => boolean
}

export type WizardStepState = "complete" | "current" | "upcoming"

/**
 * Multi-step form flow over a single form + schema. Each step lists its fields; `next()`
 * validates just those, so errors show on the step that owns them. Steps can be conditional
 * (`when`); you can jump back to any visited step.
 */
export function useFormWizard<T extends FieldValues>(
  form: UseFormReturn<T, unknown, unknown>,
  steps: readonly WizardStep<T>[],
  { initialStepId, onStepChange }: { initialStepId?: string; onStepChange?: (stepId: string) => void } = {}
) {
  const values = useWatch({ control: form.control }) as T
  const active = steps.filter((step) => !step.when || step.when(values))

  const [currentId, setCurrentId] = React.useState(initialStepId ?? active[0]?.id)
  // Opening on a later step (a restored draft, a ?step= link) counts the steps before it as visited.
  const [visited, setVisited] = React.useState<ReadonlySet<string>>(() => new Set(active.slice(0, active.findIndex((s) => s.id === currentId) + 1).map((s) => s.id)))

  // If the current step stops applying (its `when` turned false), fall back to the nearest one.
  const index = Math.max(0, active.findIndex((step) => step.id === currentId))
  const step = active[index]

  const go = (id: string) => {
    setCurrentId(id)
    setVisited((current) => new Set(current).add(id))
    onStepChange?.(id)
  }

  const next = async () => {
    const valid = step?.fields?.length ? await form.trigger(step.fields as FieldPath<T>[], { shouldFocus: true }) : true
    if (!valid) return false
    const following = active[index + 1]
    if (following) go(following.id)
    return true
  }
  const back = () => {
    const previous = active[index - 1]
    if (previous) go(previous.id)
  }
  const goTo = (id: string) => {
    if (visited.has(id) && active.some((s) => s.id === id)) go(id)
  }

  return {
    steps: active.map((s, i) => ({ ...s, state: (i < index ? "complete" : i === index ? "current" : "upcoming") as WizardStepState, visited: visited.has(s.id) })),
    step,
    index,
    count: active.length,
    isFirst: index === 0,
    isLast: index === active.length - 1,
    next,
    back,
    goTo,
  }
}

/** Step indicator for a wizard: numbered steps, completed ones checked and clickable. */
export function WizardProgress({
  steps,
  onSelect,
  className,
}: {
  steps: ReadonlyArray<{ id: string; title: string; state: WizardStepState; visited: boolean }>
  onSelect?: (id: string) => void
  className?: string
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-3", className)} aria-label="Progress">
      {steps.map((step, i) => {
        const clickable = Boolean(onSelect) && step.visited && step.state !== "current"
        const content = (
          <>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors",
                step.state === "complete" && "border-brand bg-brand text-brand-foreground",
                step.state === "current" && "border-brand text-foreground ring-3 ring-brand/15",
                step.state === "upcoming" && "border-border text-muted-foreground"
              )}
            >
              {step.state === "complete" ? <Icon name="check" size="xs" /> : i + 1}
            </span>
            <span className={cn("text-sm", step.state === "upcoming" ? "text-muted-foreground" : "font-medium")}>{step.title}</span>
          </>
        )
        return (
          <li key={step.id} className="flex items-center gap-2" aria-current={step.state === "current" ? "step" : undefined}>
            {clickable ? (
              <button type="button" onClick={() => onSelect?.(step.id)} className="flex items-center gap-2 rounded-md outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50">
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2">{content}</span>
            )}
            {i < steps.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        )
      })}
    </ol>
  )
}
