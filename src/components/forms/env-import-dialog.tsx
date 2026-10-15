"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { parseDotEnv, type EnvVar } from "@/components/forms/env"

/**
 * Import a .env: paste it or pick a file, see exactly which variables will be added and which
 * will replace an existing value (values stay hidden), then import. `existing` is the list of
 * names already defined, so the preview can say "updates".
 */
export function EnvImportDialog({
  open,
  onOpenChange,
  existing,
  onImport,
  initialText = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: readonly string[]
  onImport: (vars: EnvVar[]) => void
  initialText?: string
}) {
  const [text, setText] = React.useState(initialText)
  const fileRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (open) setText(initialText)
  }, [open, initialText])

  const parsed = parseDotEnv(text)
  const updates = parsed.filter((v) => existing.includes(v.key)).length

  const readFile = async (file: File) => setText(await file.text())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="grid gap-1.5 border-b border-border/60 px-5 py-4">
          <DialogTitle className="text-base">Import a .env</DialogTitle>
          <DialogDescription>Paste its contents or choose the file. Comments and blank lines are skipped.</DialogDescription>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid gap-2 border-border/60 p-4 md:border-r">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"DATABASE_URL=postgres://…\nREDIS_URL=redis://…\n# comments are ignored"}
              spellCheck={false}
              autoFocus
              className="surface-sunken h-64 w-full resize-none rounded-xl p-3 font-mono text-[0.78rem] leading-relaxed outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".env,.txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void readFile(file)
                  e.target.value = ""
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Icon name="file-text" />
                Choose file
              </Button>
              {text && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setText("")}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="grid content-start gap-2 p-4">
            <p className="flex items-baseline justify-between text-xs text-muted-foreground">
              Preview
              <span className="font-mono tabular-nums">
                {parsed.length - updates} new · {updates} update{updates === 1 ? "" : "s"}
              </span>
            </p>
            <ul className="surface-raised max-h-64 overflow-y-auto rounded-xl">
              {parsed.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing to import yet.</li>
              ) : (
                parsed.map((v) => {
                  const update = existing.includes(v.key)
                  return (
                    <li key={v.key} className="flex items-center gap-2 border-b border-border/50 px-3 py-2 font-mono text-[0.75rem] last:border-b-0">
                      <span className={cn("size-1.5 shrink-0 rounded-full", update ? "bg-brand" : "bg-success")} />
                      <span className="min-w-0 flex-1 truncate">{v.key}</span>
                      <span className="text-muted-foreground">{v.value ? "••••" : "(empty)"}</span>
                      <span className={cn("rounded px-1.5 py-px font-sans text-[0.625rem] tracking-wide uppercase", update ? "bg-brand/15 text-brand-ink" : "bg-success/15 text-success")}>
                        {update ? "update" : "new"}
                      </span>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 bg-card/60 px-5 py-3.5">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={parsed.length === 0}
            onClick={() => {
              onImport(parsed)
              onOpenChange(false)
            }}
          >
            Import {parsed.length || ""} {parsed.length === 1 ? "variable" : "variables"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
