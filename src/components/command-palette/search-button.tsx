"use client"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { useCommandPalette } from "@/components/command-palette/command-palette-provider"

/** Header entry point to the palette: a search field look on desktop, an icon on mobile. */
export function SearchButton({ className }: { className?: string }) {
  const { open } = useCommandPalette()
  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Search (⌘K)"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:w-56 md:pr-1.5",
        className
      )}
    >
      <Icon name="search" />
      <span className="hidden flex-1 text-left md:inline">Search…</span>
      <kbd className="hidden h-5 items-center rounded-full border border-border/70 bg-background px-1.5 font-sans text-[0.6875rem] md:inline-flex">⌘K</kbd>
    </button>
  )
}
