"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"

/**
 * Global navigation progress — a thin bar across the top while a route loads.
 *
 * Starts on any same-origin link click (whatever renders the <a>), on back/forward, or by calling
 * `startNavigationProgress()` before a programmatic `router.push`. Finishes when the URL actually
 * changes. Fast navigations never show it (SHOW_AFTER_MS).
 */

type Status = "idle" | "loading" | "done"

const SHOW_AFTER_MS = 150
/** Safety net: never leave the bar running if a navigation is cancelled. */
const GIVE_UP_AFTER_MS = 12_000

let status: Status = "idle"
let showTimer: number | undefined
let giveUpTimer: number | undefined
const listeners = new Set<() => void>()

function setStatus(next: Status) {
  status = next
  listeners.forEach((listener) => listener())
}

export function startNavigationProgress() {
  window.clearTimeout(showTimer)
  window.clearTimeout(giveUpTimer)
  showTimer = window.setTimeout(() => setStatus("loading"), SHOW_AFTER_MS)
  giveUpTimer = window.setTimeout(finishNavigationProgress, GIVE_UP_AFTER_MS)
}

export function finishNavigationProgress() {
  window.clearTimeout(showTimer)
  window.clearTimeout(giveUpTimer)
  if (status === "loading") setStatus("done")
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whether a click on this anchor will trigger a client-side navigation to a different URL. */
function isNavigationClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return false
  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  // Same page (or only the #hash differs): nothing loads.
  return url.pathname !== window.location.pathname || url.search !== window.location.search
}

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = React.useSyncExternalStore(subscribe, () => status, () => "idle" as Status)

  // The URL changed → the navigation landed.
  React.useEffect(() => {
    finishNavigationProgress()
  }, [pathname, searchParams])

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (anchor instanceof HTMLAnchorElement && isNavigationClick(event, anchor)) startNavigationProgress()
    }
    const onPopState = () => startNavigationProgress()
    // Capture phase: runs before Next's Link handler prevents the default.
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <AnimatePresence onExitComplete={() => status === "done" && setStatus("idle")}>
        {current === "loading" && (
          <motion.div
            key="bar"
            className="h-full origin-left bg-brand shadow-[0_0_8px_var(--brand)]"
            initial={{ scaleX: 0, opacity: 1 }}
            // Trickles towards 90% — it never claims to be done before the route arrives.
            animate={{ scaleX: 0.9 }}
            exit={{ scaleX: 1, opacity: 0, transition: { scaleX: { duration: 0.15 }, opacity: { duration: 0.25, delay: 0.1 } } }}
            transition={{ duration: 8, ease: [0.08, 0.82, 0.17, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
