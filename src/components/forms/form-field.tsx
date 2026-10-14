"use client"

import * as React from "react"
import { useController, type Control, type ControllerRenderProps, type FieldPath, type FieldValues } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

/** Props every field component shares. `control` makes `name` type-checked against the form. */
export type BaseFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: Control<TFieldValues, unknown, unknown>
  name: TName
  label?: React.ReactNode
  /** Help text under the control. */
  description?: React.ReactNode
  /** Shows a required marker. (Whether it's required is the schema's job.) */
  required?: boolean
  disabled?: boolean
  className?: string
}

/** What a field's control receives: RHF's field props plus the accessibility wiring. */
export type ControlProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = ControllerRenderProps<TFieldValues, TName> & {
  id: string
  "aria-invalid": boolean
  "aria-describedby"?: string
}

type FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = BaseFieldProps<TFieldValues, TName> & {
  /** "horizontal": label/description on the left, control on the right (switches, checkboxes). */
  orientation?: "vertical" | "horizontal"
  /** Render the control. Spread the props onto it. */
  children: (props: ControlProps<TFieldValues, TName>) => React.ReactNode
}

/**
 * The shell every field is built on: label, control, description and error, wired for screen
 * readers (label ↔ control, aria-invalid, aria-describedby → description + error).
 */
export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  orientation = "vertical",
  className,
  children,
}: FormFieldProps<TFieldValues, TName>) {
  const id = React.useId()
  const { field, fieldState } = useController({ control, name, disabled })
  const invalid = Boolean(fieldState.error)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = invalid ? `${id}-error` : undefined

  const labelNode = label && (
    <FieldLabel htmlFor={id}>
      {label}
      {required && (
        <span aria-hidden className="text-destructive">
          *
        </span>
      )}
    </FieldLabel>
  )
  const control_ = children({
    ...field,
    id,
    "aria-invalid": invalid,
    "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
  })
  const help = (
    <>
      {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldError id={errorId} errors={[fieldState.error]} />
    </>
  )

  if (orientation === "horizontal") {
    return (
      <Field orientation="horizontal" data-invalid={invalid || undefined} className={cn("justify-between gap-4", className)}>
        <FieldContent>
          {labelNode}
          {help}
        </FieldContent>
        {control_}
      </Field>
    )
  }

  return (
    <Field data-invalid={invalid || undefined} className={className}>
      {labelNode}
      {control_}
      {help}
    </Field>
  )
}
