import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

/**
 * Indeterminate spinner. Announced to screen readers as a status unless `decorative` (e.g. inside
 * a button that already says aria-busy). Spins slower, not never, for reduced motion — it's feedback.
 */
export function Spinner({ className, label = "Loading", decorative = false }: { className?: string; label?: string; decorative?: boolean }) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={2}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn("size-4 shrink-0 animate-spin motion-reduce:[animation-duration:1.6s]", className)}
    />
  )
}
