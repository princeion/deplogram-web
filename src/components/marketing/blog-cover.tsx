import { cn } from "@/lib/utils"
import { NodeGraph } from "@/components/shared/node-graph"

// TODO: replace with real cover art (rendered via next/image) once posts have it. This generated
// cover uses the NodeGraph motif so placeholder covers stay on-brand.
export function BlogCover({ tag, className }: { tag: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-xl border border-border/70 bg-background", className)}
    >
      <div className="absolute inset-0 gradient-wash" />
      <div className="absolute inset-0 bg-dot-grid mask-fade-edges" />
      <NodeGraph layout="pipeline" state="live" className="absolute inset-x-6 top-1/2 -translate-y-1/2 opacity-80" />
      <span className="absolute bottom-3 left-4 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
        {tag}
      </span>
    </div>
  )
}
