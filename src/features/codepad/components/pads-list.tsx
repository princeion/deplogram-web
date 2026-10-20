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

function PadRow({ pad }: { pad: PadSummary }) {
  const confirm = useConfirm()
  const remove = useDeletePad()
  const runtime = runtimeOf(pad.runtime)
  return (
    <li className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
      <span className="surface-sunken flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
        <Icon name={runtime?.icon ?? "code"} size="sm" />
      </span>
      <Link href={`/dashboard/codepad/${pad.id}`} className="grid min-w-0 flex-1 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset">
        <span className="truncate font-mono text-sm font-medium">{pad.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {runtime?.name ?? pad.runtime} · {pad.fileCount} {pad.fileCount === 1 ? "file" : "files"}
        </span>
      </Link>
      {pad.projectId && (
        <Link href={`/dashboard/projects/${pad.projectId}`} className="relative z-10 hidden rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success sm:inline">
          Deployed
        </Link>
      )}
      <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">{formatRelativeTime(pad.updatedAt)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${pad.name}`} className="relative z-10" />}>
          <Icon name="more" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/dashboard/codepad/${pad.id}`} />}>
            <Icon name="code" /> Open
          </DropdownMenuItem>
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
    </li>
  )
}

/** CodePad's front page: your pads, newest first, and "New pad". */
export function PadsList() {
  const { data, isPending, isError, refetch, isRefetching } = usePads()

  if (isPending) {
    return (
      <div className="grid gap-px overflow-hidden rounded-xl border border-border/70 bg-card" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
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
    <ul className={cn("divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card")}>
      {data.map((pad) => (
        <PadRow key={pad.id} pad={pad} />
      ))}
    </ul>
  )
}
