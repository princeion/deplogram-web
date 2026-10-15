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
import { EnvImportDialog, UnsavedChangesGuard, envVarKeySchema, parseDotEnv, type EnvVar } from "@/components/forms"

type Row = {
  id: string
  key: string
  /** Typed value; null = keep the saved value. */
  value: string | null
  savedAt: string | null
  removed: boolean
}
type RowState = "saved" | "new" | "replacing" | "removing"

let rowId = 0
const nextId = () => `row-${++rowId}`
const fromSaved = (saved: EnvVarRecord[]): Row[] => saved.map((v) => ({ id: nextId(), key: v.key, value: null, savedAt: v.updatedAt, removed: false }))
const stateOf = (r: Row): RowState => (r.removed ? "removing" : !r.savedAt ? "new" : r.value !== null ? "replacing" : "saved")

const edge: Record<RowState, string> = {
  saved: "",
  new: "before:bg-success",
  replacing: "before:bg-brand",
  removing: "before:bg-destructive",
}
const tag: Record<Exclude<RowState, "saved">, { label: string; className: string }> = {
  new: { label: "new", className: "bg-success/15 text-success" },
  replacing: { label: "changed", className: "bg-brand/15 text-brand-ink" },
  removing: { label: "removing", className: "bg-destructive/15 text-destructive" },
}

const input =
  "h-8 w-full min-w-0 rounded-md bg-transparent px-2.5 font-mono text-[0.8rem] outline-none ring-1 ring-border/60 transition-[box-shadow,background-color] placeholder:text-muted-foreground/45 hover:ring-border focus:surface-sunken focus:ring-ring/50 aria-invalid:ring-destructive/60"

/** One variable: name, its value (masked pill when saved, an input when new or being replaced), state and actions. */
function VariableRow({
  row,
  error,
  onChange,
  onPaste,
  onRemove,
}: {
  row: Row
  error?: string
  onChange: (patch: Partial<Row>) => void
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  const [shown, setShown] = React.useState(false)
  const state = stateOf(row)
  const isNew = state === "new"

  return (
    <li
      className={cn(
        "group/row relative grid gap-1.5 border-b border-border/50 px-4 py-2.5 last:border-b-0",
        "before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full",
        edge[state],
        state === "removing" && "bg-destructive/[0.04]"
      )}
    >
      <div className="grid items-center gap-x-3 gap-y-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]">
        {/* Name */}
        {isNew ? (
          <input
            value={row.key}
            onChange={(e) => onChange({ key: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
            onPaste={onPaste}
            placeholder="VARIABLE_NAME"
            aria-label="Variable name"
            aria-invalid={Boolean(error)}
            autoComplete="off"
            spellCheck={false}
            autoFocus={!row.key}
            className={input}
          />
        ) : (
          <span className={cn("flex min-w-0 items-center gap-2 font-mono text-[0.8125rem]", state === "removing" && "text-muted-foreground line-through")}>
            <Icon name="key-round" size="xs" className="shrink-0 text-muted-foreground" />
            <span className="truncate">{row.key}</span>
          </span>
        )}

        {/* Value */}
        {row.value === null ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn("surface-sunken flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 font-mono text-[0.8rem] tracking-[0.2em] text-muted-foreground/80", state === "removing" && "opacity-50")}>
              ••••••••••••
              <span className="ml-auto flex items-center gap-1 font-sans text-[0.6875rem] tracking-normal text-muted-foreground">
                <Icon name="shield" size="xs" />
                encrypted · {formatRelativeTime(row.savedAt!)}
              </span>
            </span>
          </span>
        ) : (
          <span className="relative flex min-w-0 items-center">
            <input
              value={row.value}
              onChange={(e) => onChange({ value: e.target.value })}
              type={shown ? "text" : "password"}
              placeholder={isNew ? "value" : "new value"}
              aria-label={`Value for ${row.key || "new variable"}`}
              autoComplete="new-password"
              spellCheck={false}
              autoFocus={!isNew}
              className={cn(input, "pr-9")}
            />
            <button
              type="button"
              onClick={() => setShown((v) => !v)}
              aria-label={shown ? "Hide value" : "Show value"}
              aria-pressed={shown}
              className="absolute right-1.5 flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <Icon name="eye" size="xs" className={cn(!shown && "opacity-60")} />
            </button>
          </span>
        )}

        {/* State + actions */}
        <span className="flex items-center justify-end gap-1.5 md:min-w-44">
          {state !== "saved" && <span className={cn("rounded px-1.5 py-px font-mono text-[0.625rem] tracking-wide uppercase", tag[state].className)}>{tag[state].label}</span>}
          {state === "removing" ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange({ removed: false })}>
              <Icon name="undo" />
              Undo
            </Button>
          ) : (
            <span className={cn("flex items-center gap-1", state === "saved" && "opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100")}>
              {!isNew && (
                <Button type="button" variant="ghost" size="xs" onClick={() => onChange({ value: row.value === null ? "" : null })}>
                  {row.value === null ? "Replace" : "Keep saved"}
                </Button>
              )}
              <Button type="button" variant="ghost" size="xs" className="text-muted-foreground hover:text-destructive" onClick={onRemove}>
                {isNew ? "Discard" : "Remove"}
              </Button>
            </span>
          )}
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </li>
  )
}

function Editor({ project, saved }: { project: Project; saved: EnvVarRecord[] }) {
  const [rows, setRows] = React.useState<Row[]>(() => fromSaved(saved))
  const [query, setQuery] = React.useState("")
  const [attempted, setAttempted] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [dragging, setDragging] = React.useState(false)
  const save = useSaveProjectEnv(project.id)
  const latest = useDeployment(project.latest?.id ?? "")
  const { startRedeploy } = useDeploymentActions()

  const update = (id: string, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const counts = rows.reduce((acc, r) => ({ ...acc, [stateOf(r)]: (acc[stateOf(r)] ?? 0) + 1 }), {} as Partial<Record<RowState, number>>)
  const changes = (counts.new ?? 0) + (counts.replacing ?? 0) + (counts.removing ?? 0)

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

  /** Merge imported variables: existing names get the new value (as a replacement), others are added. */
  const merge = (vars: EnvVar[]) => {
    setRows((all) => {
      const next = all.filter((r) => r.key || r.value)
      for (const v of vars) {
        const existing = next.find((r) => r.key === v.key)
        if (existing) Object.assign(existing, { value: v.value, removed: false })
        else next.push({ id: nextId(), key: v.key, value: v.value, savedAt: null, removed: false })
      }
      return [...next]
    })
    notify.success(`Imported ${vars.length} variable${vars.length === 1 ? "" : "s"}`, { description: "Review, then save." })
  }

  const onPaste = (id: string) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text.includes("\n") && !text.includes("=")) return
    if (!parseDotEnv(text).length) return
    event.preventDefault()
    setRows((all) => all.filter((r) => !(r.id === id && !r.key && !r.value)))
    setImportText(text)
    setImportOpen(true)
  }

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    setImportText(await file.text())
    setImportOpen(true)
  }

  const addRow = () => setRows((all) => [...all, { id: nextId(), key: "", value: "", savedAt: null, removed: false }])

  const submit = async (redeploy: boolean) => {
    setAttempted(true)
    if (errors.size > 0) return
    try {
      const result = await save.mutateAsync(rows.filter((r) => !r.removed).map((r) => ({ key: r.key.trim(), value: r.savedAt && r.value === null ? null : (r.value ?? "") })))
      setRows(fromSaved(result))
      setAttempted(false)
      if (redeploy && latest.data) {
        void startRedeploy(latest.data)
      } else {
        notify.success("Variables saved", {
          description: "They apply from the next deployment.",
          action: latest.data ? { label: "Redeploy now", onClick: () => void startRedeploy(latest.data!) } : undefined,
        })
      }
    } catch (error) {
      notify.error(error, { title: "Couldn't save the variables" })
    }
  }

  const q = query.trim().toUpperCase()
  const shown = rows.filter((r) => !q || r.key.toUpperCase().includes(q) || !r.key)
  const live = rows.filter((r) => !r.removed).length

  return (
    <div className="grid gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex min-w-48 flex-1 items-center sm:max-w-72">
          <Icon name="search" size="xs" className="pointer-events-none absolute left-3 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter variables"
            aria-label="Filter variables"
            className="surface-sunken h-9 w-full rounded-lg pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{live} variables</span>
        <span className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={() => (setImportText(""), setImportOpen(true))}>
            <Icon name="upload" />
            Import .env
          </Button>
          <Button type="button" variant="outline" onClick={addRow}>
            <Icon name="plus" />
            Add variable
          </Button>
        </span>
      </div>

      {/* The list — also a drop target for a .env file. */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault()
            setDragging(true)
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn("relative overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow", dragging && "ring-2 ring-brand/60 ring-offset-2 ring-offset-background")}
      >
        {dragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/85 backdrop-blur-sm">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Icon name="upload" />
              Drop your .env to import it
            </p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="grid justify-items-center gap-3 px-6 py-14 text-center">
            <span className="surface-raised flex size-11 items-center justify-center rounded-xl text-muted-foreground">
              <Icon name="variable" />
            </span>
            <div className="grid gap-1">
              <p className="text-sm font-medium">No environment variables yet</p>
              <p className="text-sm text-muted-foreground">Add them one by one, import a .env, or drop the file here.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => (setImportText(""), setImportOpen(true))}>
                Import .env
              </Button>
              <Button type="button" size="sm" onClick={addRow}>
                <Icon name="plus" />
                Add variable
              </Button>
            </div>
          </div>
        ) : (
          <ul className="surface-raised m-2 overflow-hidden rounded-xl">
            {shown.map((r) => (
              <VariableRow
                key={r.id}
                row={r}
                error={attempted || r.key ? errors.get(r.id) : undefined}
                onChange={(patch) => update(r.id, patch)}
                onPaste={onPaste(r.id)}
                onRemove={() => (stateOf(r) === "new" ? setRows((all) => all.filter((x) => x.id !== r.id)) : update(r.id, { removed: true, value: null }))}
              />
            ))}
            {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No variables match “{query.trim()}”.</li>}
          </ul>
        )}
      </div>

      {/* Save bar with a summary of what changes. */}
      {changes > 0 && (
        <div className="surface-sunken sticky bottom-3 z-10 flex animate-in flex-wrap items-center gap-3 rounded-xl border border-border/60 px-4 py-3 duration-300 fade-in slide-in-from-bottom-2">
          <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
            {counts.new ? <span className="text-success">+{counts.new} added</span> : null}
            {counts.replacing ? <span className="text-brand-ink">~{counts.replacing} replaced</span> : null}
            {counts.removing ? <span className="text-destructive">−{counts.removing} removed</span> : null}
            <span className="font-sans text-muted-foreground">applies from the next deployment</span>
          </p>
          <Button type="button" variant="ghost" onClick={() => (setRows(fromSaved(saved)), setAttempted(false))} disabled={save.isPending}>
            Discard
          </Button>
          <Button type="button" variant="outline" onClick={() => void submit(false)} loading={save.isPending}>
            Save
          </Button>
          {latest.data && (
            <Button type="button" onClick={() => void submit(true)} disabled={save.isPending}>
              <Icon name="rocket" />
              Save &amp; redeploy
            </Button>
          )}
        </div>
      )}

      <EnvImportDialog open={importOpen} onOpenChange={setImportOpen} existing={rows.filter((r) => !r.removed).map((r) => r.key)} onImport={merge} initialText={importText} />
      <UnsavedChangesGuard when={changes > 0} />
    </div>
  )
}

/** Project › Environment: the variables the app reads. Saved values are write-only. */
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
