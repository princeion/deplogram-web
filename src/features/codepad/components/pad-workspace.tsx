"use client"

import * as React from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import { runtimes } from "@/content/runtimes"
import {
  padKeys,
  useDeleteFile,
  usePad,
  useRenameFile,
  useRunLogs,
  useRunPad,
  useSaveFile,
  type Pad,
} from "@/features/codepad/codepad"
import { buildStaticPreview } from "@/features/codepad/preview"
import { CodeEditor, type CodeEditorHandle } from "@/features/codepad/components/code-editor"
import { errorMessage, notify, useConfirm } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { StatusDot } from "@/components/shared/status-dot"
import { Button, buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"
import { LogViewer, type LogLine } from "@/components/log-viewer"

/**
 * A pad, open for editing — one screen, IDE-shaped: files on the left, tabs and the editor in
 * the middle, the run output under it, and (for static sites) a live preview on the right. Edits
 * autosave a moment after typing stops; ⌘S saves now, ⌘↵ saves and runs. The workspace fills the
 * content panel instead of scrolling like other pages.
 */

const AUTOSAVE_MS = 800
const PREVIEW_MS = 300

type Buffer = { value: string; saved: string }
type SaveState = { status: "idle" | "saving" | "saved" | "error"; at?: number; error?: string }

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

export function PadWorkspace({ padId }: { padId: string }) {
  const { data: pad, isPending, isError, error, refetch, isRefetching } = usePad(padId)
  if (isPending) return <WorkspaceSkeleton />
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="p-6">
          <EmptyState
            icon="code"
            title="That pad doesn't exist."
            description="It may have been deleted, or the link is wrong."
            actions={
              <Link href="/dashboard/codepad" className={buttonVariants({ variant: "outline" })}>
                All pads
              </Link>
            }
          />
        </div>
      )
    }
    return <ErrorState title="This pad didn't load." onRetry={() => refetch()} retrying={isRefetching} />
  }
  return <Workspace key={pad.id} pad={pad} />
}

function Workspace({ pad }: { pad: Pad }) {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const save = useSaveFile(pad.id)
  const run = useRunPad(pad.id)
  const renameFile = useRenameFile(pad.id)
  const deleteFile = useDeleteFile(pad.id)
  const runtime = runtimes.find((r) => r.id === pad.runtime)
  const isStatic = pad.runtime === "static"

  // The working copy: what's in the editor (value) and what the server has (saved).
  const [buffers, setBuffers] = React.useState<Record<string, Buffer>>(() =>
    Object.fromEntries(pad.files.map((f) => [f.path, { value: f.content, saved: f.content }]))
  )
  const buffersRef = React.useRef(buffers)
  buffersRef.current = buffers
  const [tabs, setTabs] = React.useState<string[]>(pad.entry ? [pad.entry] : [])
  const [active, setActive] = React.useState<string | null>(pad.entry || null)
  const [saveState, setSaveState] = React.useState<SaveState>({ status: "idle" })
  const [runId, setRunId] = React.useState<string | null>(null)
  const logs = useRunLogs(runId)

  const dirty = Object.entries(buffers).filter(([, b]) => b.value !== b.saved).map(([path]) => path)

  // ── Saving ──────────────────────────────────────────────────────────────────
  const saveRef = React.useRef(save.mutateAsync)
  saveRef.current = save.mutateAsync
  const timers = React.useRef<Record<string, number>>({})

  const persist = React.useCallback(async (path: string) => {
    window.clearTimeout(timers.current[path])
    const buffer = buffersRef.current[path]
    if (!buffer || buffer.value === buffer.saved) return
    const content = buffer.value
    setSaveState({ status: "saving" })
    try {
      await saveRef.current({ path, content })
      setBuffers((prev) => (prev[path] ? { ...prev, [path]: { ...prev[path], saved: content } } : prev))
      setSaveState({ status: "saved", at: Date.now() })
    } catch (caught) {
      setSaveState({ status: "error", error: errorMessage(caught) })
    }
  }, [])

  const saveAll = React.useCallback(() => Promise.all(Object.keys(buffersRef.current).map(persist)), [persist])

  const edit = (path: string, value: string) => {
    setBuffers((prev) => ({ ...prev, [path]: { saved: prev[path]?.saved ?? "", value } }))
    window.clearTimeout(timers.current[path])
    timers.current[path] = window.setTimeout(() => void persist(path), AUTOSAVE_MS)
  }

  // Leaving with unsaved edits asks first.
  React.useEffect(() => {
    if (dirty.length === 0) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty.length])

  // ── Running ─────────────────────────────────────────────────────────────────
  const [previewKey, setPreviewKey] = React.useState(0)
  const startRun = React.useCallback(async () => {
    await saveAll()
    try {
      const { id } = await run.mutateAsync()
      setRunId(id)
      setPreviewKey((k) => k + 1)
    } catch (caught) {
      notify.error(caught, { title: "Couldn't start the run" })
    }
  }, [saveAll, run])

  // ⌘S / ⌘↵ anywhere in the workspace (the editor binds its own too, below).
  const startRunRef = React.useRef(startRun)
  startRunRef.current = startRun
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === "s") {
        event.preventDefault()
        void saveAll()
      } else if (event.key === "Enter") {
        event.preventDefault()
        void startRunRef.current()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [saveAll])

  const onEditorMount = (editor: CodeEditorHandle, monaco: Parameters<NonNullable<React.ComponentProps<typeof CodeEditor>["onMount"]>>[1]) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => void saveAll())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => void startRunRef.current())
    editor.focus()
  }

  // ── Files and tabs ──────────────────────────────────────────────────────────
  const open = (path: string) => {
    setTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActive(path)
  }
  const close = (path: string) => {
    void persist(path)
    setTabs((prev) => {
      const next = prev.filter((p) => p !== path)
      if (active === path) setActive(next[Math.max(0, prev.indexOf(path) - 1)] ?? null)
      return next
    })
  }

  const createFile = async (path: string) => {
    if (pad.files.some((f) => f.path === path)) return `There's already a file called ${path}.`
    try {
      const file = await saveRef.current({ path, content: "" })
      queryClient.setQueryData<Pad>(padKeys.detail(pad.id), (old) =>
        old ? { ...old, files: [...old.files, file].sort((a, b) => a.path.localeCompare(b.path)) } : old
      )
      setBuffers((prev) => ({ ...prev, [path]: { value: "", saved: "" } }))
      open(path)
      return null
    } catch (caught) {
      return errorMessage(caught)
    }
  }

  const rename = async (from: string, to: string) => {
    if (from === to) return null
    await persist(from)
    try {
      await renameFile.mutateAsync({ from, to })
      setBuffers((prev) => {
        const { [from]: moved, ...rest } = prev
        return moved ? { ...rest, [to]: moved } : rest
      })
      setTabs((prev) => prev.map((p) => (p === from ? to : p)))
      setActive((current) => (current === from ? to : current))
      return null
    } catch (caught) {
      return errorMessage(caught)
    }
  }

  const remove = (path: string) =>
    void confirm({
      title: `Delete ${path}?`,
      description: "The file is removed from this pad. This can't be undone.",
      confirmLabel: "Delete file",
      tone: "destructive",
      action: async () => {
        window.clearTimeout(timers.current[path])
        await deleteFile.mutateAsync(path)
        setBuffers(({ [path]: _gone, ...rest }) => rest)
        setTabs((prev) => prev.filter((p) => p !== path))
        setActive((current) => (current === path ? null : current))
      },
    })

  // ── Preview (static sites): follows the working copy, a beat after typing. ──
  const [previewDoc, setPreviewDoc] = React.useState<string | null>(() =>
    isStatic ? buildStaticPreview(pad.entry, (p) => buffers[p]?.value) : null
  )
  React.useEffect(() => {
    if (!isStatic) return
    const id = window.setTimeout(() => setPreviewDoc(buildStaticPreview(pad.entry, (p) => buffers[p]?.value)), PREVIEW_MS)
    return () => window.clearTimeout(id)
  }, [isStatic, pad.entry, buffers])

  const mod = isMac() ? "⌘" : "Ctrl"

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-3">
        <Link href="/dashboard/codepad" aria-label="All pads" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <Icon name="arrow-left" />
        </Link>
        <span className="surface-sunken flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
          <Icon name={runtime?.icon ?? "code"} size="xs" />
        </span>
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate font-mono text-sm font-medium">{pad.name}</h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">{runtime?.name ?? pad.runtime}</span>
        </div>
        <SaveStatus state={saveState} dirty={dirty.length} onRetry={() => void saveAll()} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void startRun()} loading={run.isPending}>
            {!run.isPending && <Icon name="play" />}
            Run
            <kbd className="ml-1 hidden rounded border border-border/70 px-1 font-mono text-[0.625rem] text-muted-foreground sm:inline">{mod}↵</kbd>
          </Button>
        </div>
      </div>

      <p className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground md:hidden">CodePad works best on a larger screen.</p>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel id="files" defaultSize="18%" minSize={150} maxSize="35%">
          <FilesPanel
            files={pad.files.map((f) => f.path)}
            entry={pad.entry}
            active={active}
            dirty={dirty}
            onOpen={open}
            onCreate={createFile}
            onRename={rename}
            onDelete={remove}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="main" defaultSize={isStatic ? "47%" : "82%"} minSize="30%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel id="editor" defaultSize="68%" minSize="25%">
              <div className="flex h-full min-h-0 flex-col bg-card">
                <Tabs tabs={tabs} active={active} dirty={dirty} onSelect={setActive} onClose={close} />
                {active && buffers[active] ? (
                  <CodeEditor
                    key={active}
                    modelPath={`${pad.id}/${active}`}
                    filePath={active}
                    value={buffers[active].value}
                    onChange={(value) => edit(active, value)}
                    onMount={onEditorMount}
                    className="flex-1"
                  />
                ) : (
                  <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted-foreground">Open a file from the list to edit it.</div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="output" defaultSize="32%" minSize={90}>
              <OutputPanel runId={runId} logs={logs.data} loading={runId != null && logs.isPending} mod={mod} entry={pad.entry} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        {isStatic && (
          <>
            <ResizableHandle />
            <ResizablePanel id="preview" defaultSize="35%" minSize="20%">
              <PreviewPanel doc={previewDoc} reloadKey={previewKey} onReload={() => setPreviewKey((k) => k + 1)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

/** "Saving…" · "Saved · just now" · "Unsaved changes" · "Couldn't save — Retry". */
function SaveStatus({ state, dirty, onRetry }: { state: SaveState; dirty: number; onRetry: () => void }) {
  const [, tick] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    const id = window.setInterval(tick, 15_000)
    return () => window.clearInterval(id)
  }, [])
  const seconds = state.at ? Math.round((Date.now() - state.at) / 1000) : null
  const ago = seconds == null ? "" : seconds < 45 ? "just now" : `${Math.round(seconds / 60)}m ago`

  let content: React.ReactNode
  if (state.status === "error") {
    content = (
      <span className="flex items-center gap-1.5 text-destructive">
        <Icon name="circle-alert" size="xs" />
        <span className="hidden sm:inline">Couldn&apos;t save</span>
        <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:no-underline">
          Retry
        </button>
      </span>
    )
  } else if (state.status === "saving") {
    content = <span className="text-muted-foreground">Saving…</span>
  } else if (dirty > 0) {
    content = <span className="text-muted-foreground">Unsaved changes</span>
  } else if (state.status === "saved") {
    content = (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon name="check" size="xs" className="text-success" /> Saved · {ago}
      </span>
    )
  } else {
    content = <span className="text-muted-foreground">All changes saved</span>
  }
  return (
    <span role="status" aria-live="polite" className="hidden text-xs md:inline-flex">
      {content}
    </span>
  )
}

function Tabs({
  tabs,
  active,
  dirty,
  onSelect,
  onClose,
}: {
  tabs: string[]
  active: string | null
  dirty: string[]
  onSelect: (path: string) => void
  onClose: (path: string) => void
}) {
  if (tabs.length === 0) return <div className="h-9 shrink-0 border-b border-border/60 bg-app-panel" />
  return (
    <div role="tablist" aria-label="Open files" className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-border/60 bg-app-panel">
      {tabs.map((path) => {
        const selected = path === active
        const changed = dirty.includes(path)
        return (
          <div
            key={path}
            className={cn(
              "group/tab relative flex shrink-0 items-center border-r border-border/50 text-xs",
              selected ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {selected && <span aria-hidden className="metal-brand absolute inset-x-0 top-0 h-0.5" />}
            <button type="button" role="tab" aria-selected={selected} onClick={() => onSelect(path)} className="h-full pr-1 pl-3 font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset">
              {path.split("/").pop()}
            </button>
            <button
              type="button"
              aria-label={`Close ${path}${changed ? " (unsaved changes)" : ""}`}
              onClick={() => onClose(path)}
              className="mr-1.5 grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {changed ? (
                <>
                  <span aria-hidden className="size-1.5 rounded-full bg-foreground/70 group-hover/tab:hidden" />
                  <Icon name="x" size="xs" className="hidden group-hover/tab:block" />
                </>
              ) : (
                <Icon name="x" size="xs" className={cn(!selected && "opacity-0 group-hover/tab:opacity-100")} />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** The pad's files: open, add, rename, delete. Paths can include folders ("src/app.js"). */
function FilesPanel({
  files,
  entry,
  active,
  dirty,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  files: string[]
  entry: string
  active: string | null
  dirty: string[]
  onOpen: (path: string) => void
  onCreate: (path: string) => Promise<string | null>
  onRename: (from: string, to: string) => Promise<string | null>
  onDelete: (path: string) => void
}) {
  const [adding, setAdding] = React.useState(false)
  const [renaming, setRenaming] = React.useState<string | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/60 pr-1.5 pl-3">
        <span className="text-xs font-medium text-muted-foreground">Files</span>
        <Button variant="ghost" size="icon-xs" aria-label="New file" onClick={() => setAdding(true)}>
          <Icon name="plus" />
        </Button>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1.5" aria-label="Files">
        {files.map((path) =>
          renaming === path ? (
            <li key={path} className="px-1.5">
              <FileNameInput initial={path} onDone={() => setRenaming(null)} onSubmit={(next) => onRename(path, next)} />
            </li>
          ) : (
            <li key={path} className="group/file relative px-1.5">
              <button
                type="button"
                onClick={() => onOpen(path)}
                className={cn(
                  "flex h-7 w-full items-center gap-2 rounded-md pr-7 pl-2 text-left font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  path === active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon name={iconFor(path)} size="xs" className="shrink-0 opacity-70" />
                <span className="truncate">
                  {path.includes("/") && <span className="text-muted-foreground/60">{path.slice(0, path.lastIndexOf("/") + 1)}</span>}
                  {path.split("/").pop()}
                </span>
                {path === entry && <span className="ml-auto shrink-0 font-sans text-[0.625rem] text-muted-foreground/70">entry</span>}
                {dirty.includes(path) && <span aria-label="unsaved" className="size-1.5 shrink-0 rounded-full bg-foreground/60" />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Actions for ${path}`}
                      className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover/file:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
                    />
                  }
                >
                  <Icon name="more" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => setRenaming(path)}>
                    <Icon name="feather" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(path)}>
                    <Icon name="trash" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        )}
        {adding && (
          <li className="px-1.5">
            <FileNameInput initial="" placeholder="new-file.js" onDone={() => setAdding(false)} onSubmit={onCreate} />
          </li>
        )}
      </ul>
    </div>
  )
}

/** Inline name field for new and renamed files: Enter saves, Escape cancels. */
function FileNameInput({
  initial,
  placeholder,
  onSubmit,
  onDone,
}: {
  initial: string
  placeholder?: string
  onSubmit: (path: string) => Promise<string | null>
  onDone: () => void
}) {
  const [value, setValue] = React.useState(initial)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const submit = async () => {
    const path = value.trim().replace(/^\/+/, "")
    if (!path || path === initial) return onDone()
    if (/\s/.test(path) || path.endsWith("/")) return setError("No spaces, and end with a file name.")
    setBusy(true)
    const problem = await onSubmit(path)
    setBusy(false)
    if (problem) setError(problem)
    else onDone()
  }
  return (
    <div className="py-0.5">
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        disabled={busy}
        spellCheck={false}
        aria-label={initial ? `New name for ${initial}` : "New file name"}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit()
          if (e.key === "Escape") onDone()
        }}
        onBlur={() => !error && void submit()}
        className="surface-sunken h-7 w-full rounded-md px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive/50"
      />
      {error && <p className="px-1 pt-1 text-[0.6875rem] text-destructive">{error}</p>}
    </div>
  )
}

function iconFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "html" || ext === "htm") return "layout" as const
  if (ext === "css") return "sparkles" as const
  if (ext === "json") return "braces" as const
  if (ext === "md" || ext === "txt") return "file-text" as const
  return "file-code" as const
}

/** The run's output in the shared log viewer, with its outcome in the header. */
function OutputPanel({
  runId,
  logs,
  loading,
  mod,
  entry,
}: {
  runId: string | null
  logs: ReturnType<typeof useRunLogs>["data"]
  loading: boolean
  mod: string
  entry: string
}) {
  const lines: LogLine[] = React.useMemo(() => logs?.lines.map((l) => ({ n: l.n, at: l.at, text: l.text, stream: l.stream })) ?? [], [logs])
  const running = runId != null && !logs?.done
  const outcome = logs?.done ? (logs.exitCode === 0 ? "ok" : "failed") : null

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center gap-2.5 border-b border-border/60 px-3 text-xs">
        <span className="font-medium text-muted-foreground">Output</span>
        {running && (
          <span className="flex items-center gap-1.5 text-brand-ink">
            <StatusDot tone="progress" motion="progress" size="sm" /> Running
          </span>
        )}
        {outcome === "ok" && (
          <span className="flex items-center gap-1.5 text-success">
            <StatusDot tone="success" size="sm" /> Finished · exit 0
          </span>
        )}
        {outcome === "failed" && (
          <span className="flex items-center gap-1.5 text-destructive">
            <StatusDot tone="danger" size="sm" /> Failed · exit {logs?.exitCode}
          </span>
        )}
      </div>
      {runId == null ? (
        <div className="grid flex-1 place-items-center p-4 text-center text-sm text-muted-foreground">
          <p>
            Press <span className="font-medium text-foreground">Run</span> ({mod}↵) to run <span className="font-mono text-foreground">{entry}</span>. Output appears here.
          </p>
        </div>
      ) : (
        <LogViewer
          key={runId}
          lines={lines}
          live={running}
          liveLabel="Running"
          loading={loading}
          fileName="codepad-output"
          height="fill"
          className="min-h-0 flex-1 rounded-none border-0"
        />
      )}
    </div>
  )
}

/** The static site in a sandboxed frame: scripts run, but it can't reach the app. */
function PreviewPanel({ doc, reloadKey, onReload }: { doc: string | null; reloadKey: number; onReload: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-app-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/60 pr-1.5 pl-3">
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
        <Button variant="ghost" size="icon-xs" aria-label="Reload preview" onClick={onReload}>
          <Icon name="refresh" />
        </Button>
      </div>
      {doc == null ? (
        <div className="grid flex-1 place-items-center p-4 text-center text-sm text-muted-foreground">Add an index.html to see a preview.</div>
      ) : (
        <iframe key={reloadKey} title="Preview" srcDoc={doc} sandbox="allow-scripts allow-modals allow-forms" className="min-h-0 flex-1 bg-white" />
      )}
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col" aria-busy="true">
      <div className="flex h-12 items-center gap-3 border-b border-border/60 px-3">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid flex-1 grid-cols-[18%_1fr] md:grid-cols-[18%_1fr_35%]">
        <div className="grid content-start gap-2 border-r border-border/60 p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        <div className="bg-card" />
        <div className="hidden border-l border-border/60 md:block" />
      </div>
    </div>
  )
}
