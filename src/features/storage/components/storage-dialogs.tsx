"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { nameProblem, useCreateFolder, useFolders, useMoveItems, useRenameItem, useStorageList, type StorageItem } from "@/features/storage/storage"
import { useStorage } from "@/features/storage/components/storage-context"
import { errorMessage, notify } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const parentOf = (path: string) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "")
const where = (folder: string) => (folder ? `/${folder}` : "Storage")

/** New folder · Upload — the page's two actions. Upload is the main one. */
export function StorageHeaderActions() {
  const { pickFiles, setNewFolderOpen } = useStorage()
  return (
    <>
      <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
        <Icon name="folder-plus" /> New folder
      </Button>
      <Button onClick={pickFiles}>
        <Icon name="upload" /> Upload
      </Button>
    </>
  )
}

/** One name field with its error under it; Enter submits. */
function NameField({ id, value, onChange, error, selectBase = false }: { id: string; value: string; onChange: (v: string) => void; error: string | null; selectBase?: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const input = ref.current
    if (!input) return
    input.focus()
    // Renaming a file: select the name, not the extension.
    const dot = selectBase ? input.value.lastIndexOf(".") : -1
    input.setSelectionRange(0, dot > 0 ? dot : input.value.length)
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Name
      </label>
      <Input ref={ref} id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} spellCheck={false} autoComplete="off" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function NewFolderDialog() {
  const { path, newFolderOpen, setNewFolderOpen } = useStorage()
  const { data } = useStorageList(path)
  const create = useCreateFolder()
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const close = () => {
    setNewFolderOpen(false)
    setName("")
    setError(null)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    const problem = nameProblem(trimmed) ?? (data?.items.some((i) => i.name === trimmed) ? `There's already something called “${trimmed}” here.` : null)
    if (problem) return setError(problem)
    try {
      await create.mutateAsync(path ? `${path}/${trimmed}` : trimmed)
      notify.success(`Folder “${trimmed}” created`, { description: `In ${where(path)}` })
      close()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <Dialog open={newFolderOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>In {where(path)}</DialogDescription>
        </DialogHeader>
        {newFolderOpen && (
          <form onSubmit={submit} className="grid gap-5">
            <NameField
              id="new-folder"
              value={name}
              onChange={(v) => {
                setName(v)
                setError(null)
              }}
              error={error}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={create.isPending}>
                Create folder
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function RenameDialog({ item, onClose }: { item: StorageItem | null; onClose: (renamed?: StorageItem) => void }) {
  const rename = useRenameItem()
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    setName(item?.name ?? "")
    setError(null)
  }, [item])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!item) return
    const trimmed = name.trim()
    if (trimmed === item.name) return onClose()
    const problem = nameProblem(trimmed)
    if (problem) return setError(problem)
    try {
      const renamed = await rename.mutateAsync({ path: item.path, name: trimmed })
      notify.success(`Renamed to “${renamed.name}”`)
      onClose(renamed)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <Dialog open={item != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename {item?.kind === "folder" ? "folder" : "file"}</DialogTitle>
          <DialogDescription>In {where(parentOf(item?.path ?? ""))}</DialogDescription>
        </DialogHeader>
        {item && (
          <form onSubmit={submit} className="grid gap-5">
            <NameField
              id="rename"
              value={name}
              onChange={(v) => {
                setName(v)
                setError(null)
              }}
              error={error}
              selectBase={item.kind === "file"}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="submit" loading={rename.isPending}>
                Rename
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * "Move to…": every folder as an indented tree. A folder can't go into itself or anything inside
 * it, and the items' current folder is marked — moving there does nothing.
 */
export function MoveDialog({ items, onClose }: { items: StorageItem[] | null; onClose: (moved?: boolean) => void }) {
  const open = items != null && items.length > 0
  const { data, isPending } = useFolders(open)
  const move = useMoveItems()
  const [target, setTarget] = React.useState<string | null>(null)
  React.useEffect(() => setTarget(null), [items])

  const sources = items ?? []
  const here = sources.length ? parentOf(sources[0].path) : ""
  const sameFolder = sources.every((i) => parentOf(i.path) === here)
  const blocked = (folder: string) => sources.some((i) => i.kind === "folder" && (folder === i.path || folder.startsWith(`${i.path}/`)))
  const label = sources.length === 1 ? `“${sources[0].name}”` : `${sources.length} items`

  const submit = async () => {
    if (target == null) return
    try {
      const { moved } = await move.mutateAsync({ paths: sources.map((i) => i.path), to: target })
      notify.success(moved ? `Moved ${label} to ${where(target)}` : "Nothing to move — already there")
      onClose(true)
    } catch (caught) {
      notify.error(caught, { title: "Couldn't move" })
    }
  }

  const folders = ["", ...(data?.folders ?? [])]
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {label}</DialogTitle>
          <DialogDescription>Choose the folder to move {sources.length === 1 ? "it" : "them"} to.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Destination folder" className="surface-sunken max-h-72 overflow-y-auto rounded-lg p-1.5">
          {isPending ? (
            <div className="grid gap-2 p-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>
          ) : (
            folders.map((folder) => {
              const depth = folder ? folder.split("/").length : 0
              const disabled = blocked(folder)
              const current = sameFolder && folder === here
              const chosen = target === folder
              return (
                <button
                  key={folder || "(root)"}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  disabled={disabled}
                  onClick={() => setTarget(folder)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
                    chosen ? "bg-brand/12 text-foreground" : "hover:bg-muted"
                  )}
                  style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
                >
                  <Icon name={folder ? "folder" : "database"} size="xs" className={cn("shrink-0", chosen ? "text-brand-ink" : "text-muted-foreground")} />
                  <span className="truncate">{folder ? folder.split("/").pop() : "Storage"}</span>
                  {current && <span className="ml-auto shrink-0 text-xs text-muted-foreground">current</span>}
                  {chosen && !current && <Icon name="check" size="xs" className="ml-auto shrink-0 text-brand-ink" />}
                </button>
              )
            })
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={target == null || (sameFolder && target === here)} loading={move.isPending}>
            {target == null ? "Move here" : `Move to ${where(target)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
