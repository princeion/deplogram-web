"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { useProject, useProjectEnv, useSaveProjectEnv, type EnvVarRecord, type Project } from "@/features/projects/projects"
import { useDeployment } from "@/features/deployments/deployments"
import { useDeploymentActions } from "@/features/deployments/components/use-deployment-actions"
import { ProjectGate } from "@/features/projects/components/project-gate"
import { PageHeader } from "@/components/app-shell/page"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { notify } from "@/components/feedback"
import { UnsavedChangesGuard, envVarKeySchema, parseDotEnv } from "@/components/forms"

type Row = {
  id: string
  key: string
  /** Typed value; null = keep the saved value. */
  value: string | null
  savedAt: string | null
  removed: boolean
}

let rowId = 0
const nextId = () => `row-${++rowId}`
const fromSaved = (saved: EnvVarRecord[]): Row[] => saved.map((v) => ({ id: nextId(), key: v.key, value: null, savedAt: v.updatedAt, removed: false }))

const cell = "h-9 w-full min-w-0 bg-transparent px-3 font-mono text-[0.8rem] outline-none placeholder:text-muted-foreground/50 hover:bg-foreground/[0.03] focus:surface-sunken"

function Editor({ project, saved }: { project: Project; saved: EnvVarRecord[] }) {
  const [rows, setRows] = React.useState<Row[]>(() => fromSaved(saved))
  const [revealed, setRevealed] = React.useState(false)
  const [attempted, setAttempted] = React.useState(false)
  const save = useSaveProjectEnv(project.id)
  const latest = useDeployment(project.latest?.id ?? "")
  const { startRedeploy } = useDeploymentActions()

  const update = (id: string, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const changes = rows.filter((r) => !r.savedAt || r.removed || r.value !== null).length
  const dirty = changes > 0

  // Names must be valid and unique among the rows that stay.
  const errors = new Map<string, string>()
  const seen = new Set<string>()
  for (const r of rows) {
    if (r.removed) continue
    const parsed = envVarKeySchema.safeParse(r.key)
    if (!parsed.success) errors.set(r.id, parsed.error.issues[0].message)
    else if (seen.has(r.key.trim())) errors.set(r.id, `${r.key.trim()} is already defined above`)
    seen.add(r.key.trim())
  }

  const onPaste = (id: string) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text.includes("\n") && !text.includes("=")) return
    const parsed = parseDotEnv(text)
    if (!parsed.length) return
    event.preventDefault()
    setRows((all) => {
      const next = all.filter((r) => !(r.id === id && !r.key && !r.value))
      for (const entry of parsed) {
        const existing = next.find((r) => r.key === entry.key && !r.removed)
        if (existing) Object.assign(existing, { value: entry.value })
        else next.push({ id: nextId(), key: entry.key, value: entry.value, savedAt: null, removed: false })
      }
      return [...next]
    })
    notify.success(`Added ${parsed.length} variable${parsed.length === 1 ? "" : "s"} from the paste`)
  }

  const submit = async () => {
    setAttempted(true)
    if (errors.size > 0) return
    try {
      const result = await save.mutateAsync(rows.filter((r) => !r.removed).map((r) => ({ key: r.key.trim(), value: r.savedAt && r.value === null ? null : (r.value ?? "") })))
      setRows(fromSaved(result))
      setAttempted(false)
      notify.success("Variables saved", {
        description: "They apply from the next deployment.",
        action: latest.data ? { label: "Redeploy now", onClick: () => void startRedeploy(latest.data!) } : undefined,
      })
    } catch (error) {
      notify.error(error, { title: "Couldn't save the variables" })
    }
  }

  return (
    <div className="grid gap-3">
      <div className="surface-raised overflow-hidden rounded-2xl">
        <div className="surface-band grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_7.5rem_5.5rem] items-center border-b border-border/60 font-mono text-[0.6875rem] text-muted-foreground uppercase max-sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem]">
          <span className="px-3 py-2">Key</span>
          <span className="flex items-center gap-2 px-3 py-2">
            Value
            <button type="button" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed} className="flex items-center gap-1 normal-case hover:text-foreground">
              <Icon name="eye" size="xs" className={cn(!revealed && "opacity-60")} />
              {revealed ? "Hide new" : "Show new"}
            </button>
          </span>
          <span className="px-3 py-2 max-sm:hidden">Updated</span>
          <span />
        </div>

        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No variables yet. Add one, or paste a .env into a key.</p>}

        {rows.map((r) => {
          const error = attempted || r.key ? errors.get(r.id) : undefined
          const isNew = !r.savedAt
          return (
            <div key={r.id} className={cn("border-b border-border/50 last:border-b-0", r.removed && "bg-destructive/[0.04]")}>
              <div className="group/row grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_7.5rem_5.5rem] items-center divide-x divide-border/40 max-sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem]">
                {isNew ? (
                  <input
                    value={r.key}
                    onChange={(e) => update(r.id, { key: e.target.value.toUpperCase() })}
                    onPaste={onPaste(r.id)}
                    placeholder="NAME"
                    aria-label="Variable name"
                    aria-invalid={Boolean(error)}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus={!r.key}
                    className={cn(cell, error && "text-destructive")}
                  />
                ) : (
                  <span className={cn("truncate px-3 font-mono text-[0.8rem]", r.removed && "text-muted-foreground line-through")}>{r.key}</span>
                )}

                {r.value === null ? (
                  <span className={cn("flex items-center gap-2 px-3 font-mono text-[0.8rem] text-muted-foreground", r.removed && "line-through")}>
                    ••••••••••
                    <span className="font-sans text-[0.6875rem] text-muted-foreground/70">encrypted</span>
                  </span>
                ) : (
                  <input
                    value={r.value}
                    onChange={(e) => update(r.id, { value: e.target.value })}
                    type={revealed ? "text" : "password"}
                    placeholder={isNew ? "value" : "new value"}
                    aria-label={`Value for ${r.key || "new variable"}`}
                    autoComplete="new-password"
                    spellCheck={false}
                    autoFocus={!isNew}
                    className={cell}
                  />
                )}

                <span className="truncate px-3 text-xs whitespace-nowrap text-muted-foreground max-sm:hidden">
                  {r.removed ? "removing" : isNew ? "new" : r.value !== null ? "replacing" : formatRelativeTime(r.savedAt!)}
                </span>

                <span className="flex items-center justify-end gap-0.5 pr-1.5">
                  {r.removed ? (
                    <Button type="button" variant="ghost" size="xs" onClick={() => update(r.id, { removed: false })}>
                      Undo
                    </Button>
                  ) : (
                    <>
                      {!isNew && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={r.value === null ? `Replace ${r.key}` : `Keep the saved ${r.key}`}
                          title={r.value === null ? "Replace value" : "Keep saved value"}
                          onClick={() => update(r.id, { value: r.value === null ? "" : null })}
                        >
                          <Icon name={r.value === null ? "refresh" : "undo"} />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${r.key || "variable"}`}
                        className="hover:text-destructive"
                        onClick={() => (isNew ? setRows((all) => all.filter((x) => x.id !== r.id)) : update(r.id, { removed: true }))}
                      >
                        <Icon name="x" />
                      </Button>
                    </>
                  )}
                </span>
              </div>
              {error && !r.removed && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
            </div>
          )
        })}

        <div className="surface-band flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 px-3 py-2 text-xs">
          <button type="button" onClick={() => setRows((all) => [...all, { id: nextId(), key: "", value: "", savedAt: null, removed: false }])} className="flex items-center gap-1 font-medium hover:text-foreground">
            <Icon name="plus" size="xs" />
            Add variable
          </button>
          <span className="text-muted-foreground">or paste a .env into a key</span>
          <span className="ml-auto font-mono text-[0.6875rem] text-muted-foreground">{rows.filter((r) => !r.removed).length} variables</span>
        </div>
      </div>

      {dirty && (
        <div className="surface-sunken sticky bottom-3 z-10 flex animate-in flex-wrap items-center gap-3 rounded-xl border border-border/60 px-4 py-3 duration-300 fade-in slide-in-from-bottom-2">
          <p className="min-w-0 flex-1 text-sm">
            {changes} unsaved {changes === 1 ? "change" : "changes"} <span className="text-muted-foreground">· applies from the next deployment</span>
          </p>
          <Button type="button" variant="ghost" onClick={() => (setRows(fromSaved(saved)), setAttempted(false))} disabled={save.isPending}>
            Discard
          </Button>
          <Button type="button" onClick={submit} loading={save.isPending}>
            Save changes
          </Button>
        </div>
      )}
      <UnsavedChangesGuard when={dirty} />
    </div>
  )
}

/** Project › Environment: the variables the app reads, edited as a table. Saved values are write-only. */
export function ProjectEnvironment({ projectId }: { projectId: string }) {
  const query = useProject(projectId)
  const env = useProjectEnv(projectId)
  return (
    <ProjectGate query={query}>
      {(project) => (
        <div className="grid gap-4">
          <PageHeader title="Environment" description="Variables your app reads at build and run time. Values are encrypted — once saved, they're never shown again." />
          {env.isPending ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : env.data ? (
            // Re-key on the saved set so a save (or another tab's change) resets the editor.
            <Editor key={env.data.map((v) => v.key + v.updatedAt).join("|")} project={project} saved={env.data} />
          ) : null}
        </div>
      )}
    </ProjectGate>
  )
}
