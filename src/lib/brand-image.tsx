import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { NODE_GRAPH_LAYOUTS, NODE_GRAPH_SPEC, edgePath } from "@/lib/node-graph"
import { themeColors } from "@/lib/theme"

/**
 * Renderers for next/og ImageResponse (OG/Twitter images, app icons). ImageResponse can't read CSS
 * variables, so colours come from src/lib/theme.ts and geometry from the NodeGraph definition.
 */

export function loadHeadingFont() {
  // Host Grotesk SemiBold (OFL) — static TTF, since Satori can't use woff2/variable fonts.
  return readFile(join(process.cwd(), "src/assets/fonts/HostGrotesk-SemiBold.ttf"))
}

/** The NodeGraph `mark` layout as a static SVG, live node lit. */
export function BrandMark({ size, glow = false }: { size: number; glow?: boolean }) {
  const layout = NODE_GRAPH_LAYOUTS.mark
  const spec = NODE_GRAPH_SPEC.mark
  const byId = new Map(layout.nodes.map((n) => [n.id, n]))
  const [w, h] = layout.viewBox
  return (
    <svg width={size} height={size} viewBox={`0 0 ${w} ${h}`} fill="none">
      {layout.edges.map(([a, b]) => {
        const from = byId.get(a)
        const to = byId.get(b)
        if (!from || !to) return null
        return (
          <path
            key={`${a}-${b}`}
            d={edgePath(from, to, layout.curved)}
            stroke={themeColors.mutedForeground}
            strokeOpacity={0.6}
            strokeWidth={spec.edgeStroke}
            strokeLinecap="round"
          />
        )
      })}
      {layout.nodes.map((node) => {
        const live = node.id === layout.live
        return (
          <g key={node.id}>
            {live && glow && <circle cx={node.x} cy={node.y} r={spec.nodeRadius * 2} fill={themeColors.brand} fillOpacity={0.18} />}
            <circle
              cx={node.x}
              cy={node.y}
              r={spec.nodeRadius}
              fill={live ? themeColors.brand : themeColors.background}
              stroke={live ? themeColors.brand : themeColors.foreground}
              strokeWidth={spec.nodeStroke}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** 1200×630 social card: mark + wordmark, title, domain. */
export function OgCard({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: `radial-gradient(60% 70% at 85% 0%, ${themeColors.brandWash}, transparent 70%), ${themeColors.background}`,
        color: themeColors.foreground,
        fontFamily: "Host Grotesk",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <BrandMark size={64} glow />
        <span style={{ fontSize: 44, letterSpacing: -1 }}>deplogram</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 26, color: themeColors.brand, letterSpacing: 4, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 980 }}>{title}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: themeColors.mutedForeground }}>
        <span>deplogram.app</span>
        <span>Deploy · CodePad · Storage · Utilities · APIs</span>
      </div>
    </div>
  )
}
