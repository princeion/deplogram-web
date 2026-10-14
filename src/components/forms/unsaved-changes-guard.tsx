"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { isNavigationClick, startNavigationProgress } from "@/components/app-shell/navigation-progress"

/**
 * Asks before leaving a page with unsaved changes: in-app link clicks get a confirmation dialog,
 * closing or reloading the tab gets the browser's own prompt.
 *
 *   <UnsavedChangesGuard when={form.formState.isDirty} />
 */
export function UnsavedChangesGuard({
  when,
  title = "Discard unsaved changes?",
  description = "You have changes on this page that haven't been saved. If you leave now, they'll be lost.",
}: {
  when: boolean
  title?: string
  description?: string
}) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!when) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    // Window capture runs before document listeners (progress bar) and Next's Link handler.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement) || !isNavigationClick(event, anchor)) return
      event.preventDefault()
      event.stopPropagation()
      setPendingHref(anchor.href)
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("click", onClick, true)
    }
  }, [when])

  const leave = () => {
    if (!pendingHref) return
    const url = new URL(pendingHref)
    setPendingHref(null)
    startNavigationProgress()
    router.push(url.pathname + url.search + url.hash)
  }

  return (
    <Dialog open={pendingHref !== null} onOpenChange={(open) => !open && setPendingHref(null)}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setPendingHref(null)} autoFocus>
            Keep editing
          </Button>
          <Button variant="destructive" onClick={leave}>
            Discard and leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
