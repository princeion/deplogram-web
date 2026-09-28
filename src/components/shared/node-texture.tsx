import { cn } from "@/lib/utils"
import { NodeGraph } from "@/components/shared/node-graph"

/** Low-opacity, static NodeGraph pattern for section backgrounds. Never above content. */
export function NodeTexture({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute opacity-25 dark:opacity-15", className)}>
      <NodeGraph layout="texture" state="idle" />
    </div>
  )
}
