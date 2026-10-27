"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useTryApi, type ApiId, type TryRequest, type TryResult } from "@/features/apis/apis"
import { EndpointList, MethodTag, ResponsePane, SnippetPane } from "@/features/apis/components/api-parts"
import { errorMessage } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Pane } from "@/components/shared/pane"
import { Button } from "@/components/ui/button"

/**
 * An API page's working area: the form on the left with its response under it, the same request
 * as code on the right. "Send" goes through the Galley with the workspace's test key, so it never
 * delivers anything real and doesn't count toward the limit.
 */
export function ApiWorkbench({
  api,
  request,
  canSend = true,
  note,
  tabs,
  preview,
  onResult,
  children,
}: {
  api: ApiId
  request: TryRequest
  canSend?: boolean
  /** What the test key does differently for this API. */
  note: React.ReactNode
  /** Switch between endpoints (OTP: send / verify). */
  tabs?: React.ReactNode
  /** Rendered from a successful response — the image, the QR code, the email. */
  preview?: (body: unknown) => React.ReactNode
  onResult?: (result: TryResult, request: TryRequest) => void
  /** The fields. */
  children: React.ReactNode
}) {
  const send = useTryApi()
  const [result, setResult] = React.useState<TryResult | null>(null)
  const [failure, setFailure] = React.useState<string | null>(null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFailure(null)
    send.mutate(request, {
      onSuccess: (r) => {
        setResult(r)
        onResult?.(r, request)
      },
      onError: (error) => setFailure(errorMessage(error)),
    })
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <div className="grid min-w-0 gap-3">
        <Pane title="Try it" icon="play" actions={<span className="pr-2 font-mono text-[0.6875rem] text-muted-foreground">test key</span>}>
          <form onSubmit={submit} className="grid">
            {tabs && <div className="border-b border-border/60 px-3.5 py-2">{tabs}</div>}
            <p className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5 font-mono text-[0.8125rem]">
              <MethodTag method={request.method} />
              {request.path}
            </p>
            <div className="grid gap-3.5 p-3.5">{children}</div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/60 px-3.5 py-3">
              <p className="min-w-0 flex-1 text-xs text-pretty text-muted-foreground">{note}</p>
              <Button type="submit" loading={send.isPending} disabled={!canSend}>
                {!send.isPending && <Icon name="send" />} Send request
              </Button>
            </div>
            {failure && (
              <p role="alert" className="flex items-center gap-1.5 border-t border-border/60 px-3.5 py-2.5 text-sm text-destructive">
                <Icon name="circle-x" size="xs" /> {failure}
              </p>
            )}
          </form>
        </Pane>
        <ResponsePane result={result} pending={send.isPending} preview={result && preview?.(result.body)} />
      </div>
      <div className="grid min-w-0 gap-3">
        <SnippetPane request={request} />
        <EndpointList api={api} />
      </div>
    </div>
  )
}

/** A label beside its control on wide panes, above it on narrow ones. */
export function TryField({ label, hint, htmlFor, children, className }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start sm:gap-3", className)}>
      <label htmlFor={htmlFor} className="pt-2 text-sm text-muted-foreground">
        {label}
      </label>
      <div className="grid gap-1">
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
