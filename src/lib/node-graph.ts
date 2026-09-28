/**
 * NodeGraph — the Deplogram brand motif. This file is the single source of truth for its geometry.
 * Spec and rules: "Brand Motif — NodeGraph" in docs/design-system.md.
 * Add new *layouts* here when needed; never a new node or edge style.
 */

export type NodeGraphSize = "mark" | "diagram"

/** Node/edge dimensions in viewBox units, per size. */
export const NODE_GRAPH_SPEC = {
  mark: { nodeRadius: 2.75, nodeStroke: 1.75, edgeStroke: 1.5, haloRadius: 0 },
  diagram: { nodeRadius: 5, nodeStroke: 1.5, edgeStroke: 1.25, haloRadius: 11 },
} as const satisfies Record<
  NodeGraphSize,
  { nodeRadius: number; nodeStroke: number; edgeStroke: number; haloRadius: number }
>

export type GraphNode = {
  id: string
  x: number
  y: number
  label?: string
  /** Render the label above the node (for top-row nodes whose edges run below). */
  labelAbove?: boolean
}

export type GraphLayout = {
  viewBox: readonly [width: number, height: number]
  nodes: readonly GraphNode[]
  edges: readonly (readonly [from: string, to: string])[]
  /** Order nodes light up in for `loading` / controlled `progress`. */
  order: readonly string[]
  /** The one node that represents "live". */
  live: string
  /** Straight edges (mark) or horizontal cubic curves (diagram). */
  curved: boolean
}

/** Logo mark, favicon, apple icon — a 4-node flow ending in the live node. */
const mark: GraphLayout = {
  viewBox: [24, 24],
  nodes: [
    { id: "a", x: 5, y: 8.5 },
    { id: "b", x: 12.5, y: 4.75 },
    { id: "c", x: 11, y: 17 },
    { id: "d", x: 19, y: 12.5 },
  ],
  edges: [
    ["a", "b"],
    ["a", "c"],
    ["b", "d"],
    ["c", "d"],
  ],
  order: ["a", "b", "c", "d"],
  live: "d",
  curved: false,
}

/** Hero — the deploy flow from push to live. Kept in step with content/deploy-flow.ts. */
const pipeline: GraphLayout = {
  viewBox: [640, 260],
  nodes: [
    { id: "push", x: 36, y: 130, label: "git push" },
    { id: "detect", x: 140, y: 130, label: "detect" },
    { id: "build", x: 248, y: 130, label: "build" },
    { id: "env", x: 372, y: 52, label: "env vars", labelAbove: true },
    { id: "domain", x: 372, y: 130, label: "domain" },
    { id: "ssl", x: 372, y: 208, label: "ssl" },
    { id: "deploy", x: 494, y: 130, label: "deploy" },
    { id: "live", x: 596, y: 130, label: "live" },
  ],
  edges: [
    ["push", "detect"],
    ["detect", "build"],
    ["build", "env"],
    ["build", "domain"],
    ["build", "ssl"],
    ["env", "deploy"],
    ["domain", "deploy"],
    ["ssl", "deploy"],
    ["deploy", "live"],
  ],
  order: ["push", "detect", "build", "env", "domain", "ssl", "deploy", "live"],
  live: "live",
  curved: true,
}

/**
 * How it works — the developer workflow: utility → api → deploy → store + domain → scale.
 * Kept in step with `workflow` in content/platform.ts.
 */
const workflow: GraphLayout = {
  viewBox: [560, 220],
  nodes: [
    { id: "utility", x: 36, y: 110, label: "utility" },
    { id: "api", x: 142, y: 110, label: "api" },
    { id: "deploy", x: 252, y: 110, label: "deploy" },
    { id: "store", x: 380, y: 44, label: "store", labelAbove: true },
    { id: "domain", x: 380, y: 176, label: "domain" },
    { id: "scale", x: 516, y: 110, label: "scale" },
  ],
  edges: [
    ["utility", "api"],
    ["api", "deploy"],
    ["deploy", "store"],
    ["deploy", "domain"],
    ["store", "scale"],
    ["domain", "scale"],
  ],
  order: ["utility", "api", "deploy", "store", "domain", "scale"],
  live: "scale",
  curved: true,
}

/** Section divider — three nodes on a line, the middle one live when used with state="live". */
const divider: GraphLayout = {
  viewBox: [120, 24],
  nodes: [
    { id: "l", x: 16, y: 12 },
    { id: "m", x: 60, y: 12 },
    { id: "r", x: 104, y: 12 },
  ],
  edges: [
    ["l", "m"],
    ["m", "r"],
  ],
  order: ["l", "m", "r"],
  live: "m",
  curved: false,
}

/** Low-opacity background texture. Always rendered idle. */
const texture: GraphLayout = {
  viewBox: [480, 320],
  nodes: [
    { id: "0", x: 40, y: 60 },
    { id: "1", x: 140, y: 30 },
    { id: "2", x: 230, y: 92 },
    { id: "3", x: 330, y: 40 },
    { id: "4", x: 440, y: 82 },
    { id: "5", x: 82, y: 170 },
    { id: "6", x: 190, y: 204 },
    { id: "7", x: 300, y: 160 },
    { id: "8", x: 412, y: 212 },
    { id: "9", x: 40, y: 282 },
    { id: "10", x: 150, y: 292 },
    { id: "11", x: 262, y: 270 },
    { id: "12", x: 372, y: 298 },
    { id: "13", x: 460, y: 262 },
  ],
  edges: [
    ["0", "1"],
    ["1", "2"],
    ["2", "3"],
    ["3", "4"],
    ["0", "5"],
    ["5", "6"],
    ["6", "2"],
    ["6", "7"],
    ["7", "3"],
    ["7", "8"],
    ["8", "4"],
    ["5", "9"],
    ["9", "10"],
    ["10", "6"],
    ["10", "11"],
    ["11", "7"],
    ["11", "12"],
    ["12", "8"],
    ["12", "13"],
    ["13", "8"],
  ],
  order: ["0", "1", "5", "2", "6", "9", "10", "3", "7", "11", "4", "8", "12", "13"],
  live: "7",
  curved: true,
}

/** Status page — platform services converging on the live edge. */
const status: GraphLayout = {
  viewBox: [360, 220],
  nodes: [
    { id: "builds", x: 40, y: 30, label: "builds" },
    { id: "deploys", x: 40, y: 104, label: "deploys" },
    { id: "apis", x: 40, y: 178, label: "apis" },
    { id: "dns", x: 180, y: 66, label: "dns" },
    { id: "ssl", x: 180, y: 142, label: "ssl" },
    { id: "edge", x: 318, y: 104, label: "edge" },
  ],
  edges: [
    ["builds", "dns"],
    ["deploys", "dns"],
    ["deploys", "ssl"],
    ["apis", "ssl"],
    ["dns", "edge"],
    ["ssl", "edge"],
  ],
  order: ["builds", "deploys", "apis", "dns", "ssl", "edge"],
  live: "edge",
  curved: true,
}

export const NODE_GRAPH_LAYOUTS = { mark, pipeline, workflow, divider, texture, status } as const
export type NodeGraphLayoutName = keyof typeof NODE_GRAPH_LAYOUTS

/**
 * Flow ("streamline") timing: light pulses travel each edge in `hop` seconds, hop by hop from the
 * first node in `order`, arriving at the live node; then the cycle pauses and repeats.
 */
export const NODE_GRAPH_FLOW = {
  hop: 0.85,
  pause: 1.1,
  /** Visible length of a pulse, as a fraction of its edge. */
  pulseLength: 0.35,
} as const

/** Hop depth of every node from the layout's first node (BFS over directed edges). */
export function nodeDepths(layout: GraphLayout): Map<string, number> {
  const depths = new Map<string, number>([[layout.order[0], 0]])
  const queue = [layout.order[0]]
  while (queue.length) {
    const id = queue.shift() as string
    for (const [from, to] of layout.edges) {
      if (from === id && !depths.has(to)) {
        depths.set(to, (depths.get(id) ?? 0) + 1)
        queue.push(to)
      }
    }
  }
  return depths
}

/** SVG path for an edge — straight for marks, horizontal cubic for diagrams. */
export function edgePath(from: GraphNode, to: GraphNode, curved: boolean): string {
  if (!curved) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const mx = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`
}
