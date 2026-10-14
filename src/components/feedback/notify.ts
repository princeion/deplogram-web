import type * as React from "react"
import { toast, type ExternalToast } from "sonner"

import { errorMessage } from "@/components/feedback/error-message"

type Action = { label: string; onClick: () => void }
type Options = { description?: React.ReactNode; action?: Action; id?: string | number; duration?: number }

const toOptions = ({ description, action, id, duration }: Options = {}): ExternalToast => ({
  description,
  id,
  duration,
  action: action ? { label: action.label, onClick: action.onClick } : undefined,
})

/**
 * Toasts for Your Galley: short, past-tense confirmations of what just happened, and plain-
 * language errors. Prefer inline feedback (field errors, callouts) when the thing is on screen;
 * toasts are for outcomes of actions whose result isn't otherwise visible.
 */
export const notify = {
  success: (title: string, options?: Options) => toast.success(title, toOptions(options)),
  info: (title: string, options?: Options) => toast.info(title, toOptions(options)),
  warning: (title: string, options?: Options) => toast.warning(title, toOptions(options)),

  /** An error toast; pass what was thrown and it becomes a readable sentence. */
  error: (error: unknown, options?: Options & { title?: string }) =>
    toast.error(options?.title ?? errorMessage(error), toOptions({ ...options, description: options?.title ? errorMessage(error) : options?.description })),

  /**
   * One toast that follows a promise: a spinner while it runs, then success or the error.
   * Resolves/rejects with the promise, so callers can still await it.
   */
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((value: T) => string); error?: string; description?: (value: T) => React.ReactNode; action?: (value: T) => Action }
  ) => {
    toast.promise(promise, {
      loading: messages.loading,
      success: (value: T) => ({
        message: typeof messages.success === "function" ? messages.success(value) : messages.success,
        description: messages.description?.(value),
        action: messages.action?.(value),
      }),
      error: (error: unknown) => (messages.error ? `${messages.error} ${errorMessage(error)}` : errorMessage(error)),
    })
    return promise
  },

  /** A done-it toast with an Undo button — for reversible actions, instead of asking first. */
  undo: (title: string, onUndo: () => void, options?: Omit<Options, "action">) =>
    toast.success(title, toOptions({ duration: 8000, ...options, action: { label: "Undo", onClick: onUndo } })),

  dismiss: (id?: string | number) => toast.dismiss(id),
}
