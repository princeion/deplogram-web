"use client"

import * as React from "react"

import type { CommandSource } from "@/components/command-palette/types"
import { CommandPalette } from "@/components/command-palette/command-palette"

type PaletteContext = {
  isOpen: boolean
  /** Open the palette, optionally straight into a sub-page (e.g. "projects"). */
  open: (page?: string) => void
  close: () => void
  toggle: () => void
  /** The sub-page to open with, consumed by the palette. */
  initialPage: string | null
  /** Sources contributed by mounted parts of the app (see useRegisterCommands). */
  sources: ReadonlyMap<string, CommandSource>
  register: (id: string, source: CommandSource) => () => void
}

const Context = React.createContext<PaletteContext | null>(null)

export function useCommandPalette() {
  const context = React.useContext(Context)
  if (!context) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>.")
  return context
}

/**
 * Contribute commands while a component is mounted — page-specific actions ("Redeploy
 * orders-api"), extra sub-pages. They disappear when the component unmounts.
 *
 *   useRegisterCommands("project-actions", { commands: [...] })
 *
 * Pass a stable or memoised source; it re-registers whenever it changes.
 */
export function useRegisterCommands(id: string, source: CommandSource) {
  const { register } = useCommandPalette()
  React.useEffect(() => register(id, source), [id, source, register])
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

/**
 * Owns the palette: open state, the global shortcuts (⌘K / Ctrl+K anywhere, "/" when not typing)
 * and the registry of contributed commands. Renders the palette itself.
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [initialPage, setInitialPage] = React.useState<string | null>(null)
  const [sources, setSources] = React.useState<ReadonlyMap<string, CommandSource>>(new Map())

  const open = React.useCallback((page?: string) => {
    setInitialPage(page ?? null)
    setIsOpen(true)
  }, [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => {
    setInitialPage(null)
    setIsOpen((value) => !value)
  }, [])

  const register = React.useCallback((id: string, source: CommandSource) => {
    setSources((current) => new Map(current).set(id, source))
    return () =>
      setSources((current) => {
        const next = new Map(current)
        next.delete(id)
        return next
      })
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggle()
      } else if (event.key === "/" && !event.metaKey && !event.ctrlKey && !isTypingTarget(event.target)) {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggle, open])

  const value = React.useMemo(
    () => ({ isOpen, open, close, toggle, initialPage, sources, register }),
    [isOpen, open, close, toggle, initialPage, sources, register]
  )

  return (
    <Context.Provider value={value}>
      {children}
      <CommandPalette />
    </Context.Provider>
  )
}
