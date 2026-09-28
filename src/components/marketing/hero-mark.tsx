import type * as React from "react"

import { cn } from "@/lib/utils"
import { NODE_GRAPH_LAYOUTS } from "@/lib/node-graph"
import { NodeGraph } from "@/components/shared/node-graph"

const layout = NODE_GRAPH_LAYOUTS.mark
const liveNode = layout.nodes.find((n) => n.id === layout.live)
// Backlight is centred on the live node, not the mark — the glow is always the live node's.
const BACKLIGHT_INSET = 0.45
const glowX = liveNode ? ((BACKLIGHT_INSET + liveNode.x / layout.viewBox[0]) / (1 + 2 * BACKLIGHT_INSET)) * 100 : 50
const glowY = liveNode ? ((BACKLIGHT_INSET + liveNode.y / layout.viewBox[1]) / (1 + 2 * BACKLIGHT_INSET)) * 100 : 50

/**
 * The logo mark at hero scale — Deplogram's answer to Vercel's triangle. The mark draws itself in,
 * the live node lights, and a soft backlight from that node breathes behind it.
 */
export function HeroMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square", className)}>
      <div
        aria-hidden
        className="absolute -inset-[45%] hero-backlight animate-breathe motion-reduce:animate-none"
        style={{ "--glow-x": `${glowX}%`, "--glow-y": `${glowY}%` } as React.CSSProperties}
      />
      <NodeGraph layout="mark" size="mark" state="live" animated flow title="Deplogram mark" className="relative size-full" />
    </div>
  )
}
