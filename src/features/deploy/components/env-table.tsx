"use client"

import * as React from "react"
import { useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import type { NewDeploymentValues } from "@/features/deploy/components/schema"
import { Icon } from "@/components/shared/icon"
import { notify } from "@/components/feedback"
import { parseDotEnv } from "@/components/forms"

const cell = "h-9 w-full bg-transparent px-3 font-mono text-[0.8rem] outline-none placeholder:text-muted-foreground/50 focus:bg-foreground/[0.03]"

/**
 * Environment variables as a table: KEY | VALUE rows with borderless inputs, values masked until
 * shown. Paste a whole .env into any key cell to fill many rows; names from the repository's
 * .env.example are offered as one-click tokens.
 */
export function EnvTable({ suggestions = [] }: { suggestions?: readonly string[] }) {
  const { control, register, getValues } = useFormContext<NewDeploymentValues>()
  const { fields, append, remove, replace } = useFieldArray({ control, name: "env" })
  const { errors } = useFormState({ control, name: "env" })
  const env = useWatch({ control, name: "env" }) ?? []
  const [revealed, setRevealed] = React.useState(false)
  const missing = suggestions.filter((key) => !env.some((row) => row?.key === key))

  const onPaste = (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text.includes("\n") && !text.includes("=")) return
    const parsed = parseDotEnv(text)
    if (!parsed.length) return
    event.preventDefault()
    const next = [...(getValues("env") ?? [])]
    if (!next[index]?.key && !next[index]?.value) next.splice(index, 1)
    for (const entry of parsed) {
      const at = next.findIndex((row) => row.key === entry.key)
      if (at > -1) next[at] = entry
      else next.push(entry)
    }
    replace(next)
    notify.success(`Added ${parsed.length} variable${parsed.length === 1 ? "" : "s"} from the paste`)
  }

  const addKeys = (keys: readonly string[]) => {
    const kept = (getValues("env") ?? []).filter((row) => row.key || row.value)
    replace([...kept, ...keys.map((key) => ({ key, value: "" }))])
  }

  const rowErrors = (Array.isArray(errors.env) ? errors.env : []) as ({ key?: { message?: string }; value?: { message?: string } } | undefined)[]
  const listError = !Array.isArray(errors.env) ? (errors.env as { message?: string } | undefined)?.message : undefined

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className={cn("grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_2.25rem] items-center border-b border-border/60 bg-foreground/[0.03] font-mono text-[0.6875rem] text-muted-foreground uppercase", fields.length === 0 && "hidden")}>
        <span className="px-3 py-2">Key</span>
        <span className="flex items-center justify-between px-3 py-2">
          Value
          {fields.length > 0 && (
            <button type="button" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed} className="flex items-center gap-1 normal-case hover:text-foreground">
              <Icon name="eye" size="xs" className={cn(!revealed && "opacity-60")} />
              {revealed ? "Hide" : "Show"}
            </button>
          )}
        </span>
        <span />
      </div>

      {fields.map((field, index) => {
        const error = rowErrors[index]?.key?.message ?? rowErrors[index]?.value?.message
        return (
          <div key={field.id} className="border-b border-border/50 last:border-b-0">
            <div className="group/row grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_2.25rem] items-center divide-x divide-border/50">
              <input
                {...register(`env.${index}.key`)}
                onPaste={onPaste(index)}
                placeholder="NAME"
                aria-label={`Variable ${index + 1} name`}
                aria-invalid={Boolean(rowErrors[index]?.key)}
                autoComplete="off"
                spellCheck={false}
                className={cn(cell, "uppercase placeholder:normal-case", rowErrors[index]?.key && "text-destructive")}
              />
              <input
                {...register(`env.${index}.value`)}
                type={revealed ? "text" : "password"}
                placeholder="value"
                aria-label={`Variable ${index + 1} value`}
                autoComplete="off"
                spellCheck={false}
                className={cell}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove variable ${index + 1}`}
                className="flex h-9 items-center justify-center text-muted-foreground opacity-60 transition-opacity group-hover/row:opacity-100 hover:text-destructive focus-visible:opacity-100"
              >
                <Icon name="x" size="xs" />
              </button>
            </div>
            {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
          </div>
        )
      })}

      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-xs", fields.length > 0 && "border-t border-border/60")}>
        <button type="button" onClick={() => append({ key: "", value: "" })} className="flex items-center gap-1 font-medium hover:text-foreground">
          <Icon name="plus" size="xs" />
          Add variable
        </button>
        <span className="text-muted-foreground">or paste a .env into a key</span>
        {missing.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <span className="text-muted-foreground">.env.example</span>
            {missing.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => addKeys([key])}
                className="rounded-[5px] bg-foreground/[0.06] px-1.5 py-px font-mono text-[0.6875rem] transition-colors hover:bg-foreground/[0.12]"
              >
                + {key}
              </button>
            ))}
          </span>
        )}
      </div>
      {listError && <p className="border-t border-border/60 px-3 py-2 text-xs text-destructive">{listError}</p>}
    </div>
  )
}
