import { cn } from "@/lib/utils"
import { NodeGraph } from "@/components/shared/node-graph"

/** Section divider built from the NodeGraph motif: hairline — ● ● ● — hairline. */
export function NodeDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-4", className)}>
      <div className="h-px flex-1 bg-linear-to-r from-transparent to-border" />
      <NodeGraph layout="divider" state="idle" className="w-20" />
      <div className="h-px flex-1 bg-linear-to-l from-transparent to-border" />
    </div>
  )
}
