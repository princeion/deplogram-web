import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A card shaped like a folder: a tab on top-left whose edge runs into the card's, so the two read
 * as one shape. Used for anything that holds files — CodePad's pads, Storage's folders. Put the
 * content inside; hover lifts the edge (pair with a covering link inside).
 */
export function FolderShape({ className, bodyClassName, children }: { className?: string; bodyClassName?: string; children: React.ReactNode }) {
  return (
    <div className={cn("group/folder relative pt-3", className)}>
      <span
        aria-hidden
        className="absolute top-0 left-0 z-[1] h-[calc(0.75rem+1px)] w-24 rounded-t-lg border border-b-0 border-border/70 bg-card transition-colors group-hover/folder:border-foreground/20"
      />
      <div className={cn("relative flex h-full flex-col rounded-xl rounded-tl-none border border-border/70 bg-card transition-colors group-hover/folder:border-foreground/20", bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
