"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/components/feedback/error-message"

export type ConfirmOptions = {
  title: React.ReactNode
  description?: React.ReactNode
  /** What's affected, shown in a recessed box (commit, branch, project…). */
  details?: React.ReactNode
  /** Say what happens: "Redeploy", "Delete project" — never "OK" or "Yes". */
  confirmLabel?: string
  cancelLabel?: string
  /** "destructive" for things that can't be undone: red confirm, Cancel focused first. */
  tone?: "default" | "destructive"
  icon?: IconName
  /** Make people type this (a project name, an email) before they can confirm. */
  confirmText?: string
  /**
   * Run the action from the dialog: the button spins while it runs, the dialog closes when it
   * succeeds, and on failure the error shows inline so people can retry or cancel.
   */
  action?: () => unknown | Promise<unknown>
}

type Request = ConfirmOptions & { resolve: (confirmed: boolean) => void }

const ConfirmContext = React.createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

/**
 * `const confirm = useConfirm()` → `if (await confirm({ title, confirmLabel })) …`.
 * Resolves true when confirmed (and, with `action`, after it succeeded), false when cancelled.
 */
export function useConfirm() {
  const confirm = React.useContext(ConfirmContext)
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>")
  return confirm
}

/** One confirm dialog for the whole app, opened imperatively through useConfirm(). */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<Request | null>(null)
  const [open, setOpen] = React.useState(false)

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...options, resolve })
        setOpen(true)
      }),
    []
  )

  const settle = (confirmed: boolean) => {
    request?.resolve(confirmed)
    setOpen(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => !next && settle(false)}
        // Keep the content during the closing animation, then drop it.
        onOpenChangeComplete={(next) => !next && setRequest(null)}
      >
        {request && <ConfirmDialogBody key={String(request.title)} request={request} onSettle={settle} />}
      </Dialog>
    </ConfirmContext.Provider>
  )
}

function ConfirmDialogBody({ request, onSettle }: { request: Request; onSettle: (confirmed: boolean) => void }) {
  const { title, description, details, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default", icon, confirmText, action } = request
  const [typed, setTyped] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const confirmRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const destructive = tone === "destructive"
  const locked = confirmText != null && typed.trim() !== confirmText

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (locked || pending) return
    if (!action) return onSettle(true)
    setPending(true)
    setError(null)
    try {
      await action()
      onSettle(true)
    } catch (caught) {
      setError(errorMessage(caught))
      setPending(false)
    }
  }

  return (
    <DialogContent
      showCloseButton={false}
      // Typing field first; otherwise Cancel for destructive actions, the action for safe ones.
      initialFocus={confirmText != null ? inputRef : destructive ? cancelRef : confirmRef}
      className="gap-0 overflow-hidden p-0 sm:max-w-[27rem]"
    >
      <form onSubmit={submit}>
        <div className="grid gap-4 p-5 sm:p-6">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              destructive ? "bg-destructive/12 text-destructive" : "bg-muted text-foreground"
            )}
          >
            <Icon name={icon ?? (destructive ? "trash" : "circle-alert")} />
          </span>
          <div className="grid gap-1.5">
            <DialogTitle className="text-base">{title}</DialogTitle>
            {description && <DialogDescription className="text-pretty">{description}</DialogDescription>}
          </div>
          {details && <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-sm">{details}</div>}
          {confirmText != null && (
            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">
                Type <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{confirmText}</span> to confirm
              </span>
              <Input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} disabled={pending} />
            </label>
          )}
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <Icon name="circle-x" size="sm" className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-card/60 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <Button ref={cancelRef} type="button" variant="ghost" disabled={pending} onClick={() => onSettle(false)}>
            {cancelLabel}
          </Button>
          <Button ref={confirmRef} type="submit" variant={destructive ? "danger" : "default"} loading={pending} disabled={locked}>
            {error ? "Try again" : confirmLabel}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
