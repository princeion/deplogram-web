"use client"

import * as React from "react"

/**
 * A small per-device preference (a list's layout, a panel's state), kept in localStorage under
 * `deplogram:<key>`. Starts at `fallback` on the server and first paint, then picks up the saved
 * value; ignores saved values that aren't in `allowed`.
 */
export function useLocalPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = React.useState<T>(fallback)
  const storageKey = `deplogram:${key}`
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved && (allowed as readonly string[]).includes(saved)) setValue(saved as T)
    } catch {}
    // `allowed` is a constant list at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])
  const change = React.useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(storageKey, next)
      } catch {}
    },
    [storageKey]
  )
  return [value, change] as const
}
