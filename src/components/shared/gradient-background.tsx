import { cn } from "@/lib/utils"

type GradientBackgroundProps = {
  className?: string
  /** Include the dotted grid texture. */
  grid?: boolean
}

/**
 * Slow-breathing brand wash + optional dotted grid, behind heroes and page headers.
 * CSS-only (background-position drift via the `gradient-wash` utility), paused for reduced motion.
 */
export function GradientBackground({ className, grid = true }: GradientBackgroundProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 gradient-wash animate-drift motion-reduce:animate-none" />
      {grid && <div className="absolute inset-0 bg-dot-grid mask-fade-edges" />}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background" />
    </div>
  )
}
