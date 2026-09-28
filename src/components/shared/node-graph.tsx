"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

import { DURATION, EASE_OUT, STAGGER } from "@/lib/motion"
import {
  NODE_GRAPH_FLOW,
  NODE_GRAPH_LAYOUTS,
  NODE_GRAPH_SPEC,
  edgePath,
  nodeDepths,
  type NodeGraphLayoutName,
  type NodeGraphSize,
} from "@/lib/node-graph"

export type NodeGraphState = "idle" | "loading" | "live"

type NodeGraphProps = {
  layout?: NodeGraphLayoutName
  size?: NodeGraphSize
  /** idle = static unlit · loading = nodes light in sequence · live = entrance, then the live node pulses once */
  state?: NodeGraphState
  /** Controlled: light the first n nodes of `layout.order`. n >= node count → live. Overrides `state`. */
  progress?: number
  /** Entrance animation (nodes scale in, edges draw). Off for marks and textures. */
  animated?: boolean
  showLabels?: boolean
  /** Once live, loop light pulses along the edges into the live node ("streamline"). Off for reduced motion. */
  flow?: boolean
  /** Accessible name. Without it the graph is decorative (aria-hidden). */
  title?: string
  className?: string
}

const LOADING_STEP_MS = 420

/**
 * The Deplogram brand motif. The one and only node-graph renderer — see docs/design-system.md.
 */
export function NodeGraph({
  layout: layoutName = "mark",
  size = "diagram",
  state = "idle",
  progress,
  animated = false,
  showLabels = false,
  flow = false,
  title,
  className,
}: NodeGraphProps) {
  const layout = NODE_GRAPH_LAYOUTS[layoutName]
  const spec = NODE_GRAPH_SPEC[size]
  const [width, height] = layout.viewBox
  const reduceMotion = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.1 })
  const hasEntered = useInView(ref, { once: true, amount: 0.2 })
  const shouldAnimate = animated && !reduceMotion
  const total = layout.order.length

  // Internal sequencing for uncontrolled `loading` (loops) and `live` (lights once after the entrance).
  const [step, setStep] = React.useState(0)
  const [liveReached, setLiveReached] = React.useState(!shouldAnimate)

  React.useEffect(() => {
    if (progress !== undefined || state !== "loading" || !inView) return
    const id = window.setInterval(() => setStep((s) => (s >= total + 1 ? 0 : s + 1)), LOADING_STEP_MS)
    return () => window.clearInterval(id)
  }, [progress, state, inView, total])

  const entranceDuration = total * STAGGER + DURATION.slow + 0.2
  React.useEffect(() => {
    if (state !== "live" || liveReached || !hasEntered) return
    const id = window.setTimeout(() => setLiveReached(true), entranceDuration * 1000)
    return () => window.clearTimeout(id)
  }, [state, liveReached, hasEntered, entranceDuration])

  const litCount =
    progress ?? (state === "loading" ? Math.min(step, total) : state === "live" && liveReached ? total : 0)
  const isLive = litCount >= total && state !== "loading"
  const lit = new Set(layout.order.slice(0, litCount))
  // In `live` state only the live node is lit (the "something is live" signal); progress lights the path.
  if (state === "live" && progress === undefined) {
    lit.clear()
    if (isLive) lit.add(layout.live)
  }

  const nodesById = new Map(layout.nodes.map((n) => [n.id, n]))
  const orderIndex = new Map(layout.order.map((id, i) => [id, i]))
  const visible = !shouldAnimate || hasEntered

  // Flow: pulses leave the first node, hop edge by edge, and arrive at the live node together.
  const flowing = flow && isLive && inView && !reduceMotion
  const depths = nodeDepths(layout)
  const arrival = (depths.get(layout.live) ?? 1) * NODE_GRAPH_FLOW.hop
  const cycle = arrival + NODE_GRAPH_FLOW.pause
  const loop = (duration: number, delay: number) => ({
    duration,
    delay,
    repeat: Infinity,
    repeatDelay: cycle - duration,
  })

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible" fill="none">
        {layout.edges.map(([fromId, toId], i) => {
          const from = nodesById.get(fromId)
          const to = nodesById.get(toId)
          if (!from || !to) return null
          const edgeLit = lit.has(fromId) && lit.has(toId)
          return (
            <motion.path
              key={`${fromId}-${toId}`}
              d={edgePath(from, to, layout.curved)}
              strokeWidth={spec.edgeStroke}
              strokeLinecap="round"
              className={cn(
                "transition-colors duration-300",
                edgeLit ? "stroke-brand-ink/70" : "stroke-muted-foreground/35"
              )}
              initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : false}
              animate={visible ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{
                duration: DURATION.slow,
                ease: EASE_OUT,
                delay: shouldAnimate ? 0.15 + i * STAGGER : 0,
              }}
            />
          )
        })}

        {flowing &&
          layout.edges.map(([fromId, toId]) => {
            const from = nodesById.get(fromId)
            const to = nodesById.get(toId)
            if (!from || !to) return null
            const L = NODE_GRAPH_FLOW.pulseLength
            const timing = loop(NODE_GRAPH_FLOW.hop, (depths.get(fromId) ?? 0) * NODE_GRAPH_FLOW.hop)
            return (
              <motion.path
                key={`flow-${fromId}-${toId}`}
                d={edgePath(from, to, layout.curved)}
                strokeWidth={spec.edgeStroke}
                strokeLinecap="round"
                className="stroke-brand-ink"
                initial={{ pathLength: L, pathSpacing: 1, pathOffset: -L, opacity: 0 }}
                animate={{ pathOffset: [-L, 1], opacity: [0, 1, 1, 0] }}
                transition={{
                  pathOffset: { ...timing, ease: "easeInOut" },
                  opacity: { ...timing, ease: "linear", times: [0, 0.2, 0.8, 1] },
                }}
              />
            )
          })}

        {layout.nodes.map((node) => {
          const nodeLit = lit.has(node.id)
          const isLiveNode = node.id === layout.live
          const delay = shouldAnimate ? (orderIndex.get(node.id) ?? 0) * STAGGER : 0
          return (
            <g key={node.id}>
              {isLiveNode && spec.haloRadius > 0 && isLive && (
                <motion.circle
                  // Re-keyed each time the graph goes live so the pulse plays once per cycle.
                  key={`halo-${litCount}`}
                  cx={node.x}
                  cy={node.y}
                  r={spec.haloRadius}
                  className="fill-brand/15"
                  initial={reduceMotion ? { opacity: 1 } : { scale: 0.6, opacity: 0.9 }}
                  animate={reduceMotion ? { opacity: 1 } : { scale: [0.6, 1.8, 1], opacity: [0.9, 0, 1] }}
                  transition={{ duration: 1.4, ease: EASE_OUT, times: [0, 0.6, 1] }}
                />
              )}
              {isLiveNode && flowing && (
                // Arrival ripple: expands from the live node each time the pulses land.
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={spec.nodeRadius}
                  strokeWidth={spec.nodeStroke / 2}
                  className="fill-none stroke-brand"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                  transition={{ ...loop(1, arrival - 0.05), ease: EASE_OUT }}
                />
              )}
              <motion.g
                // Live node beats as the pulses arrive.
                animate={isLiveNode && flowing ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                transition={isLiveNode && flowing ? { ...loop(0.45, arrival - 0.1), ease: "easeOut" } : undefined}
              >
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={spec.nodeRadius}
                strokeWidth={spec.nodeStroke}
                className={cn(
                  "transition-colors duration-300",
                  nodeLit ? "fill-brand stroke-brand" : "fill-background stroke-muted-foreground",
                  nodeLit && isLiveNode && "drop-shadow-glow"
                )}
                initial={shouldAnimate ? { scale: 0, opacity: 0 } : false}
                animate={visible ? { scale: 1, opacity: 1 } : undefined}
                transition={{ duration: DURATION.base, ease: EASE_OUT, delay }}
              />
              </motion.g>
            </g>
          )
        })}
      </svg>

      {showLabels &&
        layout.nodes.map((node) =>
          node.label ? (
            <span
              key={`label-${node.id}`}
              className={cn(
                "absolute hidden -translate-x-1/2 font-mono text-xs whitespace-nowrap transition-colors duration-300 sm:block",
                node.id === layout.live && isLive
                  ? "text-brand-ink"
                  : lit.has(node.id)
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
              style={
                node.labelAbove
                  ? {
                      left: `${(node.x / width) * 100}%`,
                      bottom: `${((height - node.y + spec.haloRadius + 4) / height) * 100}%`,
                    }
                  : {
                      left: `${(node.x / width) * 100}%`,
                      top: `${((node.y + spec.haloRadius + 6) / height) * 100}%`,
                    }
              }
            >
              {node.label}
            </span>
          ) : null
        )}
    </div>
  )
}

/**
 * HTML node dot — same recipe as a NodeGraph node, for timelines, status rows and pills.
 */
export function NodeDot({ lit = false, className }: { lit?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full border-[1.5px] transition-colors duration-300",
        lit ? "border-brand bg-brand shadow-glow" : "border-muted-foreground bg-background",
        className
      )}
    />
  )
}
