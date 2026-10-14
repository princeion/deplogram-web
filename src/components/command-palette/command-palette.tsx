"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command as Cmdk, defaultFilter } from "cmdk"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { startNavigationProgress } from "@/components/app-shell/navigation-progress"
import { useCommandPalette } from "@/components/command-palette/command-palette-provider"
import { pushRecent, readRecent } from "@/components/command-palette/recent"
import type { CommandKind, PaletteCommand, PalettePage } from "@/components/command-palette/types"
import { useBuiltinCommands } from "@/components/command-palette/use-builtin-commands"

/** Typing one of these first narrows the palette to one kind of command (shown as a chip). */
const prefixes: Record<string, { kind: CommandKind; label: string }> = {
  ">": { kind: "action", label: "Actions" },
  "@": { kind: "project", label: "Projects" },
}
const prefixLabel = Object.fromEntries(Object.values(prefixes).map((p) => [p.kind, p.label])) as Partial<Record<CommandKind, string>>

/** Group order; contributed (page-specific) groups come first, then these. */
const groupOrder = ["Recent", "Projects", "Pages", "Actions", "Help"]

/**
 * Item values must be unique for cmdk, so they carry the group and id after a separator — but only
 * the label and subtitle are scored, or ids like "prj_orders" would fuzzy-match unrelated searches.
 */
const SEPARATOR = "␟"
const scoredText = (value: string) => value.split(SEPARATOR)[0] ?? value

const subscribeNoop = () => () => {}
/** "⌘" on Apple platforms, "Ctrl" elsewhere. */
function useModKey() {
  const isApple = React.useSyncExternalStore(
    subscribeNoop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true
  )
  return isApple ? "⌘" : "Ctrl"
}

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/70 bg-muted/60 px-1 font-sans text-[0.6875rem] text-muted-foreground", className)}>
      {children}
    </kbd>
  )
}

function CommandRow({ command, onSelect, mod }: { command: PaletteCommand; onSelect: (command: PaletteCommand) => void; mod: string }) {
  return (
    <Cmdk.Item
      value={`${command.label} ${command.subtitle ?? ""}${SEPARATOR}${command.group}:${command.id}`}
      keywords={command.keywords ? [...command.keywords] : undefined}
      onSelect={() => onSelect(command)}
      className="group/item flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[selected=true]:bg-muted"
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground group-data-[selected=true]/item:text-foreground">
        {command.leading ?? (command.icon ? <Icon name={command.icon} /> : null)}
      </span>
      <span className="min-w-0 truncate">{command.label}</span>
      {command.subtitle && <span className="min-w-0 truncate text-xs text-muted-foreground">{command.subtitle}</span>}
      <span className="ml-auto flex shrink-0 items-center gap-1 pl-2">
        {command.shortcut?.map((key) => <Kbd key={key}>{key === "mod" ? mod : key}</Kbd>)}
        {command.external && <Icon name="arrow-up-right" size="xs" className="text-muted-foreground" />}
        {command.page && <Icon name="chevron-right" size="xs" className="text-muted-foreground" />}
      </span>
    </Cmdk.Item>
  )
}

/**
 * The ⌘K command palette: search every page, project and action; nested pages ("Switch
 * project…"); recents; prefix filters (`>` actions, `@` projects); commands contributed by the
 * current page. Mounted once by CommandPaletteProvider.
 */
export function CommandPalette() {
  const router = useRouter()
  const mod = useModKey()
  const { isOpen, close, initialPage, sources } = useCommandPalette()
  const builtin = useBuiltinCommands()

  const [search, setSearch] = React.useState("")
  const [kindFilter, setKindFilter] = React.useState<CommandKind | null>(null)
  const [pageStack, setPageStack] = React.useState<string[]>([])
  const [recentIds, setRecentIds] = React.useState<string[]>([])

  // Fresh state every time it opens.
  React.useEffect(() => {
    if (!isOpen) return
    setSearch("")
    setKindFilter(null)
    setPageStack(initialPage ? [initialPage] : [])
    setRecentIds(readRecent())
  }, [isOpen, initialPage])

  const contributed = [...sources.values()]
  const allCommands = [...contributed.flatMap((s) => s.commands ?? []), ...(builtin.commands ?? [])]
  const allPages: PalettePage[] = [...contributed.flatMap((s) => s.pages ?? []), ...(builtin.pages ?? [])]
  const page = allPages.find((p) => p.id === pageStack.at(-1))

  // What to list: the open sub-page, or everything (narrowed by a prefix), plus recents when idle.
  const listed = (page ? page.commands : allCommands).filter((command) => !kindFilter || command.kind === kindFilter)
  const recent =
    !page && !kindFilter && !search
      ? recentIds.flatMap((id) => allCommands.find((c) => c.id === id) ?? []).map((c) => ({ ...c, group: "Recent" }))
      : []

  const groups = new Map<string, PaletteCommand[]>()
  for (const command of [...recent, ...listed]) groups.set(command.group, [...(groups.get(command.group) ?? []), command])
  const rank = (group: string) => (groupOrder.includes(group) ? groupOrder.indexOf(group) + 1 : 0)
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => (a === "Recent" ? -1 : b === "Recent" ? 1 : rank(a) - rank(b)))

  const onSearchChange = (value: string) => {
    const prefix = prefixes[value[0] ?? ""]
    if (prefix && !page && !kindFilter) {
      setKindFilter(prefix.kind)
      setSearch(value.slice(1).trimStart())
    } else {
      setSearch(value)
    }
  }

  /** Leave the innermost filter: the prefix chip first, then sub-pages. */
  const stepBack = () => {
    if (kindFilter) setKindFilter(null)
    else setPageStack((stack) => stack.slice(0, -1))
  }

  const run = (command: PaletteCommand) => {
    if (command.page) {
      setPageStack((stack) => [...stack, command.page!])
      setKindFilter(null)
      setSearch("")
      return
    }
    if (command.recent ?? Boolean(command.href && !command.external)) pushRecent(command.id)
    close()
    if (command.href) {
      if (command.external) window.open(command.href, "_blank", "noopener,noreferrer")
      else if (command.href !== window.location.pathname) {
        startNavigationProgress()
        router.push(command.href)
      }
    }
    command.perform?.()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && search === "" && (kindFilter || pageStack.length > 0)) {
      event.preventDefault()
      stepBack()
    }
  }

  const chip = kindFilter ? prefixLabel[kindFilter] : page?.title

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton={false} className="top-[14%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search pages, projects and actions.</DialogDescription>

        <Cmdk
          loop
          label="Command palette"
          onKeyDown={onKeyDown}
          filter={(value, searchValue, keywords) => (searchValue ? defaultFilter(scoredText(value), searchValue, keywords) : 1)}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border/70 px-3">
            <Icon name="search" className="shrink-0 text-muted-foreground" />
            {chip && (
              <button
                type="button"
                onClick={stepBack}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/70"
                aria-label={`Remove filter: ${chip}`}
              >
                {chip}
                <Icon name="x" size="xs" className="text-muted-foreground" />
              </button>
            )}
            <Cmdk.Input
              value={search}
              onValueChange={onSearchChange}
              placeholder={page?.placeholder ?? (kindFilter ? `Search ${chip?.toLowerCase()}…` : "Search pages, projects and actions…")}
              className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Kbd className="hidden sm:inline-flex">Esc</Kbd>
          </div>

          <Cmdk.List className="max-h-[min(60vh,26rem)] scroll-py-2 overflow-y-auto overscroll-contain p-2" data-lenis-prevent>
            <Cmdk.Empty className="grid gap-1 px-4 py-10 text-center">
              <span className="text-sm">No results for “{search}”.</span>
              {!kindFilter && !page && (
                <span className="text-xs text-muted-foreground">
                  Try <Kbd>&gt;</Kbd> for actions or <Kbd>@</Kbd> for projects.
                </span>
              )}
            </Cmdk.Empty>
            {orderedGroups.map(([group, commands]) => (
              <Cmdk.Group
                key={group}
                heading={group}
                className="mb-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:text-muted-foreground"
              >
                {commands.map((command) => (
                  <CommandRow key={`${group}:${command.id}`} command={command} onSelect={run} mod={mod} />
                ))}
              </Cmdk.Group>
            ))}
          </Cmdk.List>

          <div className="flex items-center justify-between gap-4 border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                Open
              </span>
              {(kindFilter || pageStack.length > 0) && (
                <span className="hidden items-center gap-1 sm:flex">
                  <Kbd>⌫</Kbd>
                  Back
                </span>
              )}
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex items-center gap-1">
                <Kbd>&gt;</Kbd>
                Actions
              </span>
              <span className="flex items-center gap-1">
                <Kbd>@</Kbd>
                Projects
              </span>
            </span>
          </div>
        </Cmdk>
      </DialogContent>
    </Dialog>
  )
}
