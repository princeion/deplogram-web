import Link from "next/link"

import { cn } from "@/lib/utils"
import { NodeGraph } from "@/components/shared/node-graph"

type LogoProps = {
  className?: string
  /** Render the wordmark next to the mark. */
  wordmark?: boolean
}

// TODO: replace with the final logo once brand assets exist. The mark is the NodeGraph `mark` layout.
export function Logo({ className, wordmark = true }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Deplogram home"
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <NodeGraph layout="mark" size="mark" state="live" className="size-6" />
      {wordmark && <span className="font-heading text-lg font-semibold tracking-tight">deplogram</span>}
    </Link>
  )
}
