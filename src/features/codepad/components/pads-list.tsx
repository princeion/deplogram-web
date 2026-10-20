"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { runtimes } from "@/content/runtimes"
import { padTemplates, useCreatePad, useDeletePad, usePads, type PadSummary, type PadTemplate } from "@/features/codepad/codepad"
import { projectNameSchema } from "@/features/deploy/components/schema"
import { Form, FormRootError, RadioCardsField, TextField, useZodForm } from "@/components/forms"
import { notify, useConfirm } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"

const runtimeOf = (id: string) => runtimes.find((r) => r.id === id)

const newPadSchema = z.object({
  name: projectNameSchema,
  template: z.enum(padTemplates.map((t) => t.id) as [PadTemplate, ...PadTemplate[]]),
})

/** Opens the New pad dialog — a link to `?new=1`, so any button can open it. */
export function NewPadButton({ className }: { className?: string }) {
  return (
    <Link href="/dashboard/codepad?new=1" scroll={false} className={buttonVariants({ className })}>
      <Icon name="plus" /> New pad
    </Link>
  )
}

/**
 * "New pad": a name (a valid project name, since a pad can become one) and a starter. Open while
 * the URL has `?new`.
 */
export function NewPadDialog() {
  const router = useRouter()
  const pathname = usePathname()
  const open = useSearchParams().has("new")
  const onOpenChange = (next: boolean) => {
    if (!next) router.replace(pathname, { scroll: false })
  }
  const create = useCreatePad()
  const form = useZodForm(newPadSchema, { defaultValues: { name: "", template: "static" } })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) form.reset()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New pad</DialogTitle>
          <DialogDescription>A small project you write here. Run it, preview it, then deploy it when it&apos;s ready.</DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={async (values) => {
            const pad = await create.mutateAsync(values)
            router.push(`/dashboard/codepad/${pad.id}`)
          }}
        >
          <TextField control={form.control} name="name" label="Name" placeholder="my-landing-page" mono autoFocus autoComplete="off" spellCheck={false} />
          <RadioCardsField
            control={form.control}
            name="template"
            label="Start from"
            columns={3}
            options={padTemplates.map((t) => ({ value: t.id, label: t.label, description: t.description, icon: runtimeOf(t.runtime)?.icon }))}
          />
          <FormRootError />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Create pad
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** Open / Delete for a pad — the same menu in both views. */
function PadActions({ pad }: { pad: PadSummary }) {
  const confirm = useConfirm()
  const remove = useDeletePad()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${pad.name}`} className="relative z-10" />}>
        <Icon name="more" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href={`/dashboard/codepad/${pad.id}`} />}>
          <Icon name="code" /> Open
        </DropdownMenuItem>
        {pad.projectId && (
          <DropdownMenuItem render={<Link href={`/dashboard/projects/${pad.projectId}`} />}>
            <Icon name="folder" /> Open the project
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            void confirm({
              title: `Delete ${pad.name}?`,
              description: pad.projectId
                ? "The pad and its files are deleted. The project it was deployed as keeps running."
                : "The pad and its files are deleted. This can't be undone.",
              confirmLabel: "Delete pad",
              tone: "destructive",
              action: async () => {
                await remove.mutateAsync(pad.id)
                notify.success(`${pad.name} was deleted`)
              },
            })
          }
        >
          <Icon name="trash" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The whole card or row opens the pad; the menu and badges sit above that link. */
const coverLink = "outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"

function DeployedBadge({ pad }: { pad: PadSummary }) {
  if (!pad.projectId) return null
  return (
    <Link href={`/dashboard/projects/${pad.projectId}`} className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success hover:bg-success/15">
      <span className="size-1.5 rounded-full bg-current" />
      Deployed
    </Link>
  )
}

function PadRow({ pad }: { pad: PadSummary }) {
  const runtime = runtimeOf(pad.runtime)
  return (
    <li className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
      <span className="surface-sunken flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
        <Icon name={runtime?.icon ?? "code"} size="sm" />
      </span>
      <Link href={`/dashboard/codepad/${pad.id}`} className={cn("grid min-w-0 flex-1", coverLink)}>
        <span className="truncate font-mono text-sm font-medium">{pad.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {runtime?.name ?? pad.runtime} · {pad.fileCount} {pad.fileCount === 1 ? "file" : "files"}
        </span>
      </Link>
      <span className="hidden sm:inline">
        <DeployedBadge pad={pad} />
      </span>
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">{formatRelativeTime(pad.updatedAt)}</span>
      <PadActions pad={pad} />
    </li>
  )
}

/**
 * A pad as a folder: a tab on top, the runtime and name, the first few files inside it, and when
 * it last changed. The tab overlaps the card's edge so the two read as one shape.
 */
function PadFolder({ pad }: { pad: PadSummary }) {
  const runtime = runtimeOf(pad.runtime)
  const shown = pad.paths.slice(0, 3)
  const more = pad.paths.length - shown.length
  return (
    <li className="group/folder relative pt-3">
      {/* The folder's tab. */}
      <span
        aria-hidden
        className="absolute top-0 left-0 z-[1] h-[calc(0.75rem+1px)] w-24 rounded-t-lg border border-b-0 border-border/70 bg-card transition-colors group-hover/folder:border-foreground/20"
      />
      <div className="relative flex h-full flex-col gap-4 rounded-xl rounded-tl-none border border-border/70 bg-card p-4 transition-colors group-hover/folder:border-foreground/20">
        <div className="flex items-start gap-3">
          <span className="surface-sunken flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
            <Icon name={runtime?.icon ?? "code"} size="sm" />
          </span>
          <Link href={`/dashboard/codepad/${pad.id}`} className={cn("grid min-w-0 flex-1", coverLink)}>
            <span className="truncate font-mono text-sm font-medium">{pad.name}</span>
            <span className="truncate text-xs text-muted-foreground">{runtime?.name ?? pad.runtime}</span>
          </Link>
          <span className="-mt-1 -mr-1.5">
            <PadActions pad={pad} />
          </span>
        </div>

        {/* What's inside. */}
        <ul aria-label="Files" className="surface-sunken grid gap-1 rounded-lg px-3 py-2.5 font-mono text-xs text-muted-foreground">
          {shown.map((path) => (
            <li key={path} className="flex min-w-0 items-center gap-2">
              <Icon name={fileIcon(path)} size="xs" className="shrink-0 opacity-70" />
              <span className="truncate">{path}</span>
            </li>
          ))}
          {more > 0 && <li className="pl-5.5 font-sans text-muted-foreground/70">+{more} more</li>}
          {shown.length === 0 && <li className="font-sans">No files yet</li>}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {pad.fileCount} {pad.fileCount === 1 ? "file" : "files"} · {formatRelativeTime(pad.updatedAt)}
          </span>
          <DeployedBadge pad={pad} />
        </div>
      </div>
    </li>
  )
}

/** The dashed folder at the end of the grid: a new pad. */
function NewPadFolder() {
  return (
    <li className="relative pt-3">
      <Link
        href="/dashboard/codepad?new=1"
        scroll={false}
        className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 text-sm text-muted-foreground transition-colors outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Icon name="plus" />
        New pad
      </Link>
    </li>
  )
}

function fileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase()
  if (ext === "html" || ext === "htm") return "layout" as const
  if (ext === "json") return "braces" as const
  if (ext === "md" || ext === "txt") return "file-text" as const
  return "file-code" as const
}

type PadsView = "folders" | "list"
const VIEW_KEY = "deplogram:codepad:view"

/** Folders or list — remembered on this device. */
function usePadsView() {
  const [view, setView] = React.useState<PadsView>("folders")
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === "folders" || saved === "list") setView(saved)
    } catch {}
  }, [])
  const change = (next: PadsView) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {}
  }
  return [view, change] as const
}

/** CodePad's front page: your pads, newest first, as folders or a list. */
export function PadsList() {
  const { data, isPending, isError, refetch, isRefetching } = usePads()
  const [view, setView] = usePadsView()

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="mt-3 h-48 rounded-xl" />
        ))}
      </div>
    )
  }
  if (isError) return <ErrorState title="Your pads didn't load." onRetry={() => refetch()} retrying={isRefetching} />
  if (data.length === 0) {
    return (
      <EmptyState
        icon="code"
        title="No pads yet."
        description="A pad is a small project you write here — a static page, a Node.js server or a Python script. Run it, preview it, deploy it."
        actions={<NewPadButton />}
      />
    )
  }
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {data.length} {data.length === 1 ? "pad" : "pads"}
        </p>
        <Segmented
          label="Layout"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "folders", label: <ViewLabel icon="grid" text="Folders" /> },
            { value: "list", label: <ViewLabel icon="list" text="List" /> },
          ]}
        />
      </div>
      {view === "folders" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((pad) => (
            <PadFolder key={pad.id} pad={pad} />
          ))}
          <NewPadFolder />
        </ul>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
          {data.map((pad) => (
            <PadRow key={pad.id} pad={pad} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ViewLabel({ icon, text }: { icon: "grid" | "list"; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon name={icon} size="xs" />
      {text}
    </span>
  )
}
