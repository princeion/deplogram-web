"use client"

import * as React from "react"
import type { FieldPath, FieldValues } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { IconName } from "@/components/shared/icon"
import { Icon } from "@/components/shared/icon"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FormField, type BaseFieldProps } from "@/components/forms/form-field"

/*
 * Typed field components. Every one takes `control` + `name` (checked against the form's schema),
 * `label`, `description`, `required`, `disabled` — and handles its own error display.
 *
 *   <TextField control={form.control} name="buildCommand" label="Build command" placeholder="npm run build" />
 */

type InputLikeProps = Pick<React.ComponentProps<"input">, "placeholder" | "autoComplete" | "inputMode" | "spellCheck" | "autoFocus" | "maxLength">

// ── Text ─────────────────────────────────────────────────────────────────────────

export function TextField<T extends FieldValues, N extends FieldPath<T>>({
  type = "text",
  mono,
  readOnly,
  ...props
}: BaseFieldProps<T, N> &
  InputLikeProps & {
    type?: "text" | "email" | "url" | "tel" | "search" | "number"
    /** Monospace input — commands, keys, ports. */
    mono?: boolean
    readOnly?: boolean
  }) {
  const { placeholder, autoComplete, inputMode, spellCheck, autoFocus, maxLength, ...field } = props
  return (
    <FormField {...field}>
      {({ value, ...control }) => (
        <Input
          {...control}
          value={value ?? ""}
          type={type}
          readOnly={readOnly}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          spellCheck={spellCheck ?? (mono ? false : undefined)}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={cn(mono && "font-mono text-[0.8125rem]", readOnly && "text-muted-foreground")}
        />
      )}
    </FormField>
  )
}

export function TextareaField<T extends FieldValues, N extends FieldPath<T>>({
  rows = 4,
  mono,
  ...props
}: BaseFieldProps<T, N> & Pick<React.ComponentProps<"textarea">, "placeholder" | "rows" | "maxLength"> & { mono?: boolean }) {
  const { placeholder, maxLength, ...field } = props
  return (
    <FormField {...field}>
      {({ value, ...control }) => (
        <Textarea
          {...control}
          value={value ?? ""}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(mono && "font-mono text-[0.8125rem]")}
        />
      )}
    </FormField>
  )
}

// ── Secret ───────────────────────────────────────────────────────────────────────

/** Masked by default, with reveal and copy. For tokens, passwords, connection strings. */
export function SecretField<T extends FieldValues, N extends FieldPath<T>>({
  copyable = true,
  ...props
}: BaseFieldProps<T, N> & InputLikeProps & { copyable?: boolean }) {
  const [revealed, setRevealed] = React.useState(false)
  const { placeholder, autoComplete = "off", ...field } = props
  return (
    <FormField {...field}>
      {({ value, ...control }) => (
        <InputGroup>
          <InputGroupInput
            {...control}
            value={value ?? ""}
            type={revealed ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            spellCheck={false}
            className="font-mono text-[0.8125rem]"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label={revealed ? "Hide value" : "Show value"} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
              <Icon name={revealed ? "eye" : "eye"} className={cn(!revealed && "opacity-60")} />
            </InputGroupButton>
            {copyable && (
              <InputGroupButton
                size="icon-xs"
                aria-label="Copy value"
                disabled={!value}
                onClick={() => navigator.clipboard.writeText(String(value ?? "")).then(() => toast.success("Copied"))}
              >
                <Icon name="copy" />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  )
}

// ── Choice ───────────────────────────────────────────────────────────────────────

export type FieldOption<V extends string = string> = {
  value: V
  label: string
  description?: string
  icon?: IconName
  disabled?: boolean
}

export function SelectField<T extends FieldValues, N extends FieldPath<T>>({
  options,
  placeholder = "Select…",
  ...field
}: BaseFieldProps<T, N> & { options: readonly FieldOption[]; placeholder?: string }) {
  return (
    <FormField {...field}>
      {({ value, onChange, onBlur, ref, id, disabled, ...aria }) => (
        <Select
          value={value ?? null}
          onValueChange={(next) => onChange(next)}
          items={options.map((o) => ({ value: o.value, label: o.label }))}
          disabled={disabled}
        >
          <SelectTrigger ref={ref} id={id} onBlur={onBlur} className="w-full" {...aria}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.icon && <Icon name={option.icon} />}
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

/**
 * Options as selectable cards (icon, label, description) — for choices that deserve weight, like
 * the runtime picker. Arrow keys move between cards.
 */
export function RadioCardsField<T extends FieldValues, N extends FieldPath<T>>({
  options,
  columns = 2,
  ...field
}: BaseFieldProps<T, N> & { options: readonly FieldOption[]; columns?: 2 | 3 | 4 }) {
  return (
    <FormField {...field}>
      {({ value, onChange, onBlur, ref, id, disabled, ...aria }) => (
        <RadioGroup
          value={value ?? ""}
          onValueChange={(next) => onChange(next)}
          onBlur={onBlur}
          disabled={disabled}
          aria-labelledby={undefined}
          className={cn(
            "grid gap-2",
            columns === 2 && "sm:grid-cols-2",
            columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-2 lg:grid-cols-4"
          )}
          {...aria}
        >
          {options.map((option, index) => {
            const optionId = `${id}-${option.value}`
            const selected = value === option.value
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  selected ? "border-foreground/60 bg-muted/60" : "border-border/70 hover:bg-muted/30",
                  option.disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {option.icon && (
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70", selected && "border-brand bg-brand text-brand-foreground")}>
                    <Icon name={option.icon} filled={selected} />
                  </span>
                )}
                <span className="grid min-w-0 gap-0.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description && <span className="text-xs text-pretty text-muted-foreground">{option.description}</span>}
                </span>
                <RadioGroupItem
                  id={optionId}
                  value={option.value}
                  disabled={option.disabled}
                  // RHF focuses the first option when the field has an error.
                  ref={index === 0 ? ref : undefined}
                  className="ml-auto shrink-0"
                />
              </label>
            )
          })}
        </RadioGroup>
      )}
    </FormField>
  )
}

// ── Toggles ──────────────────────────────────────────────────────────────────────

/** On/off setting: label and description on the left, switch on the right. */
export function SwitchField<T extends FieldValues, N extends FieldPath<T>>(field: BaseFieldProps<T, N>) {
  return (
    <FormField {...field} orientation="horizontal">
      {({ value, onChange, onBlur, ref, ...control }) => (
        <Switch {...control} ref={ref} checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} onBlur={onBlur} />
      )}
    </FormField>
  )
}

/** Agreement or a single opt-in: checkbox first, then the label. */
export function CheckboxField<T extends FieldValues, N extends FieldPath<T>>(field: BaseFieldProps<T, N>) {
  return (
    <FormField {...field} orientation="horizontal" className={cn("flex-row-reverse justify-end", field.className)}>
      {({ value, onChange, onBlur, ref, ...control }) => (
        <Checkbox {...control} ref={ref} checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked === true)} onBlur={onBlur} />
      )}
    </FormField>
  )
}
