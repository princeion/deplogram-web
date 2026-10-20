"use client"

import * as React from "react"

import { SidebarProvider } from "@/components/ui/sidebar"

/** Same name the shadcn SidebarProvider writes when it manages itself. */
const SIDEBAR_COOKIE = "sidebar_state"
const scopeKey = (scope: string) => `deplogram:sidebar:${scope}`

type ScopeContext = (scope: { id: string; defaultOpen: boolean } | null) => void
const SidebarScopeContext = React.createContext<ScopeContext | null>(null)

/**
 * The Galley's sidebar state, with room for pages that want their own. Normally it's one
 * preference for the whole app (the cookie, read on the server so the first paint is right).
 * A page can claim a scope — CodePad collapses to the icon rail to give the editor room — and
 * while it's mounted, toggling the sidebar there is remembered for that scope only (localStorage).
 * Leaving the page brings back the app-wide state, which the scope never touched.
 */
export function GalleySidebarProvider({ defaultOpen, className, children }: { defaultOpen: boolean; className?: string; children: React.ReactNode }) {
  const [globalOpen, setGlobalOpen] = React.useState(defaultOpen)
  const [scope, setScope] = React.useState<{ id: string; open: boolean } | null>(null)

  const claim = React.useCallback<ScopeContext>((next) => {
    if (!next) return setScope(null)
    let open = next.defaultOpen
    try {
      const saved = localStorage.getItem(scopeKey(next.id))
      if (saved != null) open = saved === "true"
    } catch {}
    setScope({ id: next.id, open })
  }, [])

  const open = scope ? scope.open : globalOpen
  const onOpenChange = (value: boolean) => {
    if (scope) {
      setScope({ ...scope, open: value })
      try {
        localStorage.setItem(scopeKey(scope.id), String(value))
      } catch {}
      return
    }
    setGlobalOpen(value)
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`
  }

  return (
    <SidebarScopeContext.Provider value={claim}>
      <SidebarProvider open={open} onOpenChange={onOpenChange} className={className}>
        {children}
      </SidebarProvider>
    </SidebarScopeContext.Provider>
  )
}

/**
 * Give this page its own sidebar state while it's mounted:
 *
 *   useSidebarScope("codepad", false)   // collapsed the first time, then whatever you left it as
 */
export function useSidebarScope(id: string, defaultOpen: boolean) {
  const claim = React.useContext(SidebarScopeContext)
  React.useEffect(() => {
    claim?.({ id, defaultOpen })
    return () => claim?.(null)
  }, [claim, id, defaultOpen])
}
