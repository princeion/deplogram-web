"use client"

import * as React from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

type DraftOptions<T extends FieldValues> = {
  /** "session" (default) survives refreshes but not closing the tab; "local" survives both. */
  storage?: "session" | "local"
  /**
   * Strip what must never be stored in the browser before saving — e.g. secret values:
   *   transform: (v) => ({ ...v, env: v.env.map((e) => ({ ...e, value: "" })) })
   */
  transform?: (values: T) => Partial<T>
  enabled?: boolean
}

const PREFIX = "deplogram:draft:"

/**
 * Keeps a form's unsaved input across refreshes: restores it on mount (as dirty changes on top of
 * the defaults) and saves as you type. Call `clear()` after a successful submit.
 */
export function useFormDraft<T extends FieldValues>(
  form: UseFormReturn<T, unknown, unknown>,
  key: string,
  { storage = "session", transform, enabled = true }: DraftOptions<T> = {}
) {
  const [restored, setRestored] = React.useState(false)
  const storageKey = PREFIX + key
  const store = React.useCallback(() => {
    try {
      return storage === "local" ? window.localStorage : window.sessionStorage
    } catch {
      return null // storage blocked
    }
  }, [storage])

  // Restore once.
  React.useEffect(() => {
    if (!enabled) return
    const raw = store()?.getItem(storageKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as Partial<T>
      form.reset({ ...form.getValues(), ...draft }, { keepDefaultValues: true })
      setRestored(true)
    } catch {
      store()?.removeItem(storageKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore on mount only
  }, [enabled, storageKey])

  // Save as values change (debounced).
  React.useEffect(() => {
    if (!enabled) return
    let timer: number | undefined
    const subscription = form.watch((values) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        try {
          const data = transform ? transform(values as T) : values
          store()?.setItem(storageKey, JSON.stringify(data))
        } catch {
          // Quota or blocked storage: drafts are best effort.
        }
      }, 400)
    })
    return () => {
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [enabled, form, storageKey, store, transform])

  const clear = React.useCallback(() => {
    store()?.removeItem(storageKey)
    setRestored(false)
  }, [store, storageKey])

  return { restored, clear }
}
