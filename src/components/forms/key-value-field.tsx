"use client"

import * as React from "react"
import { useFieldArray, useFormContext, useFormState, type ArrayPath, type FieldValues, type Path, type FieldError as RHFFieldError } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { parseDotEnv, type EnvVar } from "@/components/forms/env"

/** Reads a nested error (e.g. "env.2.key") from RHF's errors object. */
function errorAt(errors: unknown, path: string): RHFFieldError | undefined {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], errors) as RHFFieldError | undefined
}

type KeyValueFieldProps<T extends FieldValues> = {
  name: ArrayPath<T>
  label?: React.ReactNode
  description?: React.ReactNode
  keyPlaceholder?: string
  valuePlaceholder?: string
  /** Mask values until revealed — on for environment variables. */
  secret?: boolean
  className?: string
}

/**
 * Editable list of key/value pairs — environment variables. Add and remove rows; paste a whole
 * .env file into any name box to fill many rows at once; values are masked until revealed.
 * Validate with `envVarsSchema` (names, duplicates). Must be inside <Form>.
 */
export function KeyValueField<T extends FieldValues>({
  name,
  label = "Environment variables",
  description,
  keyPlaceholder = "NAME",
  valuePlaceholder = "value",
  secret = true,
  className,
}: KeyValueFieldProps<T>) {
  const { control, register, getValues } = useFormContext<T>()
  const { errors } = useFormState({ control, name: name as unknown as Path<T> })
  const { fields, append, remove, replace } = useFieldArray({ control, name })
  const [revealed, setRevealed] = React.useState(!secret)
  const id = React.useId()

  const rows = () => (getValues(name as unknown as Path<T>) ?? []) as EnvVar[]
  const addRow = () => append({ key: "", value: "" } as never)

  /** A pasted .env (several lines, or KEY=VALUE) fills rows instead of one box. */
  const onPasteKey = (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text.includes("\n") && !text.includes("=")) return
    const parsed = parseDotEnv(text)
    if (parsed.length === 0) return
    event.preventDefault()

    const current = rows()
    const next = [...current]
    // The row being pasted into is replaced if it's empty.
    if (!next[index]?.key && !next[index]?.value) next.splice(index, 1)
    for (const entry of parsed) {
      const existing = next.findIndex((row) => row.key === entry.key)
      if (existing > -1) next[existing] = entry
      else next.push(entry)
    }
    replace(next as never)
    toast.success(`Added ${parsed.length} variable${parsed.length === 1 ? "" : "s"} from paste`)
  }

  const listError = errorAt(errors, name)

  return (
    <Field className={className} data-invalid={Boolean(listError?.message) || undefined}>
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1">
          {label && <FieldLabel htmlFor={`${id}-0-key`}>{label}</FieldLabel>}
          <FieldDescription>{description ?? "Paste a .env file into a name box to add many at once."}</FieldDescription>
        </div>
        {secret && fields.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed((r) => !r)} aria-pressed={revealed}>
            <Icon name="eye" className={cn(!revealed && "opacity-60")} />
            {revealed ? "Hide values" : "Show values"}
          </Button>
        )}
      </div>

      {fields.length > 0 && (
        <ul className="grid gap-2">
          {fields.map((row, index) => {
            const keyPath = `${name}.${index}.key` as Path<T>
            const valuePath = `${name}.${index}.value` as Path<T>
            const keyError = errorAt(errors, keyPath)
            const valueError = errorAt(errors, valuePath)
            return (
              <li key={row.id} className="grid gap-1">
                <div className="flex items-start gap-2">
                  <Input
                    {...register(keyPath)}
                    id={`${id}-${index}-key`}
                    placeholder={keyPlaceholder}
                    aria-label={`Name ${index + 1}`}
                    aria-invalid={Boolean(keyError)}
                    autoComplete="off"
                    spellCheck={false}
                    onPaste={onPasteKey(index)}
                    className="flex-[2] font-mono text-[0.8125rem] uppercase placeholder:normal-case"
                  />
                  <Input
                    {...register(valuePath)}
                    type={revealed ? "text" : "password"}
                    placeholder={valuePlaceholder}
                    aria-label={`Value ${index + 1}`}
                    aria-invalid={Boolean(valueError)}
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-[3] font-mono text-[0.8125rem]"
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove variable ${index + 1}`} onClick={() => remove(index)}>
                    <Icon name="trash" />
                  </Button>
                </div>
                <FieldError errors={[keyError, valueError].filter((error) => error?.message)} />
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Icon name="plus" />
          Add variable
        </Button>
        {fields.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => replace([] as never)}>
            Clear all
          </Button>
        )}
      </div>
      {listError?.message && <FieldError>{listError.message}</FieldError>}
    </Field>
  )
}
