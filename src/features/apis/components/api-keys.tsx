"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { accessLabel, apiList, useApiKeys, useCreateApiKey, useRevokeApiKey, type ApiId, type ApiKey, type CreatedApiKey } from "@/features/apis/apis"
import { errorMessage, notify, useConfirm } from "@/components/feedback"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { CopyButton } from "@/components/shared/copy-button"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

/** "Live" in brand, "Test" quiet — the one thing to notice about a key. */
function ModeTag({ mode }: { mode: ApiKey["mode"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-px font-mono text-[0.6875rem]",
        mode === "live" ? "border-brand/40 text-brand-ink" : "border-border text-muted-foreground"
      )}
    >
      {mode}
    </span>
  )
}

/** Opens the create dialog — also from `?new=1`, so other pages can link straight to it. */
export function NewApiKeyButton() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const open = params.get("new") === "1"
  const setOpen = (next: boolean) => router.replace(next ? `${pathname}?new=1` : pathname, { scroll: false })
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icon name="plus" /> Create key
      </Button>
      <CreateKeyDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function ApiKeysTable() {
  const { data, isPending, error, refetch } = useApiKeys()
  const revoke = useRevokeApiKey()
  const confirm = useConfirm()

  const columns = React.useMemo<DataTableColumn<ApiKey>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        className: "max-w-0 w-full",
        skeleton: "w-40",
        cell: (k) => (
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate font-medium">{k.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{k.prefix}…</span>
          </span>
        ),
      },
      { id: "mode", header: "Mode", className: "w-20", skeleton: "w-10", cell: (k) => <ModeTag mode={k.mode} /> },
      { id: "access", header: "Can call", className: "w-44", hideBelow: "md", skeleton: "w-20", cell: (k) => <span className="text-muted-foreground">{accessLabel(k.access)}</span> },
      {
        id: "used",
        header: "Last used",
        className: "w-32",
        hideBelow: "sm",
        skeleton: "w-16",
        cell: (k) =>
          k.lastUsedAt ? (
            <time dateTime={k.lastUsedAt} className="whitespace-nowrap text-muted-foreground">
              {formatRelativeTime(k.lastUsedAt)}
            </time>
          ) : (
            <span className="text-muted-foreground/70">Never</span>
          ),
      },
      {
        id: "created",
        header: "Created",
        align: "end",
        className: "w-36",
        hideBelow: "lg",
        skeleton: "w-20",
        cell: (k) => (
          <span className="whitespace-nowrap text-muted-foreground" title={`by ${k.createdBy}`}>
            {formatDate(k.createdAt.slice(0, 10))}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      caption="API keys"
      columns={columns}
      data={data?.items}
      getRowId={(k) => k.id}
      isLoading={isPending}
      error={error}
      onRetry={() => refetch()}
      skeletonRows={3}
      rowActions={(k) => [
        {
          label: "Revoke",
          icon: "trash",
          destructive: true,
          onSelect: () =>
            void confirm({
              title: `Revoke “${k.name}”?`,
              description: "Anything using this key starts getting 401 straight away. This can't be undone — you'd create a new key instead.",
              details: <span className="font-mono">{k.prefix}…</span>,
              confirmLabel: "Revoke key",
              tone: "destructive",
              action: async () => {
                await revoke.mutateAsync(k.id)
                notify.success(`“${k.name}” revoked`)
              },
            }),
        },
      ]}
      empty={<p className="px-4 py-8 text-center text-sm text-muted-foreground">No keys yet. Create one to call the APIs from your code.</p>}
    />
  )
}

/** Name, mode, which APIs — then the secret, shown this once. */
function CreateKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateApiKey()
  const [name, setName] = React.useState("")
  const [mode, setMode] = React.useState<ApiKey["mode"]>("live")
  const [everything, setEverything] = React.useState(true)
  const [access, setAccess] = React.useState<ApiId[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<CreatedApiKey | null>(null)

  const reset = () => {
    setName("")
    setMode("live")
    setEverything(true)
    setAccess([])
    setError(null)
    setCreated(null)
  }
  const close = () => {
    onOpenChange(false)
    // After the closing animation, so the secret doesn't flash back to the form.
    window.setTimeout(reset, 200)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError("Give it a name — what will use it?")
    if (!everything && access.length === 0) return setError("Pick at least one API.")
    try {
      setCreated(await create.mutateAsync({ name: name.trim(), mode, access: everything ? [] : access }))
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your key now</DialogTitle>
              <DialogDescription>This is the only time it&apos;s shown. Put it in your app&apos;s environment as DEPLOGRAM_KEY.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <div className="surface-sunken flex items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-3">
                <code className="min-w-0 flex-1 font-mono text-sm break-all">{created.secret}</code>
                <CopyButton value={created.secret} />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-brand-ink">
                <Icon name="circle-alert" size="xs" /> Lose it and you&apos;ll need a new key — we only keep a hash.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>One key per app or environment, so you can revoke one without touching the others.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <label htmlFor="key-name" className="text-sm font-medium">
                Name
              </label>
              <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="orders-api production" autoComplete="off" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Mode</span>
              <Segmented
                label="Mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "live", label: "Live" },
                  { value: "test", label: "Test" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                {mode === "live" ? "Real codes, real emails — counts toward your limits." : "Nothing is delivered and nothing counts. For development and CI."}
              </p>
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-1.5 text-sm font-medium">Can call</legend>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={everything} onCheckedChange={(checked) => setEverything(checked === true)} /> All APIs, including new ones
              </label>
              {!everything && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {apiList.map((api) => (
                    <label key={api.id} className="flex items-center gap-2.5 text-sm">
                      <Checkbox
                        checked={access.includes(api.id)}
                        onCheckedChange={(checked) => setAccess((list) => (checked ? [...list, api.id] : list.filter((id) => id !== api.id)))}
                      />
                      <Icon name={api.icon} size="xs" className="text-muted-foreground" />
                      {api.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={create.isPending}>
                Create key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
