"use client"

import type * as React from "react"
import { FormProvider, useFormState, type FieldValues, type Path, type UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import { Icon } from "@/components/shared/icon"

/**
 * Error body the backend is asked to return for rejected input (HTTP 400/422):
 *   { "error": { "message": "…", "fields": { "name": "That name is taken." } } }
 * A flat { message, fields } is accepted too.
 */
type ServerErrorBody = { message?: string; fields?: Record<string, string>; error?: { message?: string; fields?: Record<string, string> } | string }

const FALLBACK_MESSAGE = "Something went wrong saving this. Try again."

/** Puts a failed submit's errors where they belong: on fields, or at the top of the form. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T, unknown, unknown>, error: unknown) {
  if (!(error instanceof ApiError)) {
    form.setError("root.server", { type: "server", message: FALLBACK_MESSAGE })
    return
  }
  const body = (error.body ?? {}) as ServerErrorBody
  const nested = typeof body.error === "object" ? body.error : undefined
  const fields = nested?.fields ?? body.fields ?? {}
  const message = nested?.message ?? (typeof body.error === "string" ? body.error : undefined) ?? body.message

  const fieldNames = Object.keys(fields)
  fieldNames.forEach((name, index) =>
    form.setError(name as Path<T>, { type: "server", message: fields[name] }, { shouldFocus: index === 0 })
  )
  if (message || fieldNames.length === 0) {
    form.setError("root.server", { type: "server", message: message ?? FALLBACK_MESSAGE })
  }
}

type FormProps<TFieldValues extends FieldValues, TTransformed> = Omit<React.ComponentProps<"form">, "onSubmit"> & {
  form: UseFormReturn<TFieldValues, unknown, TTransformed>
  /** Receives validated (Zod-parsed) values. Throw an ApiError to show the server's errors. */
  onSubmit: (values: TTransformed) => unknown | Promise<unknown>
}

/**
 * The form element for every Deplogram form: provides the form context, validates, submits, and
 * maps backend errors onto fields (see applyServerErrors). Pair with FormRootError + FormActions.
 */
export function Form<TFieldValues extends FieldValues, TTransformed>({ form, onSubmit, className, children, ...props }: FormProps<TFieldValues, TTransformed>) {
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors("root.server")
    try {
      await onSubmit(values)
    } catch (error) {
      applyServerErrors(form, error)
    }
  })

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className={cn("grid gap-6", className)} {...props}>
        {children}
      </form>
    </FormProvider>
  )
}

/** The form-level error (from the server, or set manually on "root.server"). Renders nothing otherwise. */
export function FormRootError({ className }: { className?: string }) {
  const { errors } = useFormState()
  const message = errors.root?.server?.message
  if (!message) return null
  return (
    <div role="alert" className={cn("flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive", className)}>
      <Icon name="circle-alert" className="mt-0.5" />
      <span className="text-pretty">{message}</span>
    </div>
  )
}
