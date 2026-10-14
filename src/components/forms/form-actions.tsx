"use client"

import { useFormContext, useFormState } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type FormActionsProps = {
  submitLabel?: string
  /** Secondary button. Defaults to "Discard changes", which resets the form (shown only when dirty). */
  cancelLabel?: string
  onCancel?: () => void
  /** Disable submit until something has changed — right for edit forms, wrong for create forms. */
  requireDirty?: boolean
  /** Sticks to the bottom of the viewport on long forms. */
  sticky?: boolean
  className?: string
}

/** Submit (with pending state) and cancel/discard, for any form inside <Form>. */
export function FormActions({
  submitLabel = "Save changes",
  cancelLabel,
  onCancel,
  requireDirty = true,
  sticky = false,
  className,
}: FormActionsProps) {
  const { reset } = useFormContext()
  const { isSubmitting, isDirty } = useFormState()
  const showCancel = Boolean(onCancel) || isDirty

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        sticky && "sticky bottom-0 -mx-4 border-t border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6",
        className
      )}
    >
      {showCancel && (
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel ?? (() => reset())}>
          {cancelLabel ?? (onCancel ? "Cancel" : "Discard changes")}
        </Button>
      )}
      <Button type="submit" variant="inverted" loading={isSubmitting} disabled={requireDirty && !isDirty}>
        {submitLabel}
      </Button>
    </div>
  )
}
