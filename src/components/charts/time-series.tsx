"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ZIndexLayer,
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  usePlotArea,
} from "recharts"

import { cn } from "@/lib/utils"
import { formatCompact } from "@/lib/format"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { chartColor, type ChartSeries, type ValueFormat } from "@/components/charts/types"

type Row = Record<string, string | number>

type TimeSeriesProps<K extends string> = {
  data: readonly Row[]
  series: readonly ChartSeries<K>[]
  /** Key of the x value in each row; ISO dates by default. */
  xKey?: string
  height?: number
  /** Value format for the y-axis and tooltip. */
  format?: ValueFormat
  /** Short x label for ticks and the active pill ("Oct 3"). */
  xFormat?: (value: string) => string
  /** Long x label for the tooltip header ("Fri, Oct 3"). */
  tooltipLabelFormat?: (value: string) => string
  className?: string
}

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" })
const longDate = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value)
export const formatShortDate = (value: string) => (isIsoDate(value) ? shortDate.format(new Date(value)) : value)
export const formatLongDate = (value: string) => (isIsoDate(value) ? longDate.format(new Date(value)) : value)

const toConfig = (series: readonly ChartSeries[]): ChartConfig =>
  Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: chartColor(s.color) }]))

/** The floating readout: the x label, then a row per series. */
function ChartTooltipCard({
  active,
  payload,
  label,
  series,
  format,
  labelFormat,
}: {
  active?: boolean
  payload?: readonly { dataKey?: unknown; value?: unknown }[]
  label?: unknown
  series: readonly ChartSeries[]
  format: ValueFormat
  labelFormat: (v: string) => string
}) {
  if (!active || !payload?.length) return null
  const byKey = new Map(payload.map((item) => [String(item.dataKey), item.value]))
  return (
    <div className="min-w-40 rounded-lg border border-border/70 bg-popover/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md">
      <p className="mb-1.5 text-muted-foreground">{labelFormat(String(label))}</p>
      <div className="grid gap-1">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: chartColor(s.color) }} />
            <span className="text-foreground/80">{s.label}</span>
            <span className="ml-auto pl-4 font-medium text-foreground tabular-nums">{format(Number(byKey.get(s.key) ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The hovered x value as a solid pill over the axis — so you always know where you are. */
function ActiveAxisPill({ format }: { format: (v: string) => string }) {
  const coordinate = useActiveTooltipCoordinate()
  const label = useActiveTooltipLabel()
  const plot = usePlotArea()
  if (!coordinate || !plot || label == null) return null
  const text = format(String(label))
  const width = text.length * 6.4 + 22
  const x = Math.min(Math.max(coordinate.x - width / 2, plot.x - 8), plot.x + plot.width - width + 8)
  return (
    <ZIndexLayer zIndex={1500}>
      <g className="pointer-events-none">
        <rect x={x} y={plot.y + plot.height + 5} width={width} height={22} rx={11} className="fill-foreground" />
        <text x={x + width / 2} y={plot.y + plot.height + 16.5} textAnchor="middle" dominantBaseline="central" className="fill-background text-[11px] font-medium">
          {text}
        </text>
      </g>
    </ZIndexLayer>
  )
}

/** An x-axis label that steps aside (fades out) when the active pill comes near it. */
function AxisTick({ x, y, payload, format }: { x?: number; y?: number; payload?: { value: unknown }; format: (v: string) => string }) {
  const active = useActiveTooltipCoordinate()
  const near = active != null && x != null && Math.abs(active.x - x) < 60
  return (
    <text x={x} y={y} dy={4} textAnchor="middle" className="fill-muted-foreground text-xs transition-opacity duration-150" style={{ opacity: near ? 0 : 1 }}>
      {format(String(payload?.value ?? ""))}
    </text>
  )
}

/** Legend as a row of dots — put it above the chart, next to the headline number. */
export function ChartLegend({ series, className }: { series: readonly ChartSeries[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-[3px]" style={{ background: chartColor(s.color) }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

function useAxes<K extends string>({ xKey = "date", format = formatCompact, xFormat = formatShortDate, tooltipLabelFormat = formatLongDate, series }: TimeSeriesProps<K>) {
  return {
    grid: <CartesianGrid vertical={false} strokeDasharray="2 4" className="[&_line]:stroke-border" />,
    x: <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={12} minTickGap={28} tick={<AxisTick format={xFormat} />} />,
    y: <YAxis width={52} tickLine={false} axisLine={false} tickMargin={6} tickCount={5} tickFormatter={(v) => format(Number(v))} />,
    pill: <ActiveAxisPill format={xFormat} />,
    tooltip: (cursor: React.ComponentProps<typeof Tooltip>["cursor"]) => (
      <Tooltip
        cursor={cursor}
        position={{ y: 4 }}
        offset={14}
        animationDuration={180}
        content={({ active, payload, label }) => (
          <ChartTooltipCard active={active} payload={payload} label={label} series={series} format={format} labelFormat={tooltipLabelFormat} />
        )}
      />
    ),
  }
}

/**
 * Values over time as soft areas: a crisp line on top, a fill that fades downward and toward
 * both edges, a crosshair, a tooltip card and the active date as a pill on the axis.
 * The first series is the hero; later ones (e.g. "previous period") sit quieter.
 */
export function AreaTimeSeries<K extends string>(props: TimeSeriesProps<K>) {
  const { data, series, xKey = "date", height = 260, className } = props
  const id = React.useId().replace(/:/g, "")
  const axes = useAxes(props)

  return (
    <ChartContainer config={toConfig(series)} className={cn("aspect-auto w-full", className)} style={{ height }}>
      <AreaChart data={data as Row[]} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`${id}-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor(s.color)} stopOpacity={i === 0 ? 0.32 : 0.12} />
              <stop offset="100%" stopColor={chartColor(s.color)} stopOpacity={0} />
            </linearGradient>
          ))}
          {/* Fade the lines and fills out toward the left and right edges. */}
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.15} />
            <stop offset="8%" stopColor="#fff" stopOpacity={1} />
            <stop offset="92%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0.15} />
          </linearGradient>
          <mask id={`${id}-mask`} maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill={`url(#${id}-edge)`} />
          </mask>
        </defs>
        {axes.grid}
        {axes.x}
        {axes.y}
        {axes.tooltip({ stroke: "var(--foreground)", strokeOpacity: 0.55, strokeWidth: 1 })}
        {[...series].reverse().map((s) => {
          const hero = s.key === series[0].key
          return (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="monotone"
              stroke={chartColor(s.color)}
              strokeWidth={hero ? 1.75 : 1.25}
              strokeDasharray={hero ? undefined : "4 4"}
              fill={`url(#${id}-fill-${s.key})`}
              mask={`url(#${id}-mask)`}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 2, className: "fill-background", stroke: chartColor(s.color) }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          )
        })}
        {axes.pill}
      </AreaChart>
    </ChartContainer>
  )
}

/**
 * Bars over time, side by side or `stacked`. Each bar fades toward its base, with rounded tops;
 * hovering lights a column band, shows the tooltip and pins the x label as a pill.
 */
export function BarTimeSeries<K extends string>(props: TimeSeriesProps<K> & { stacked?: boolean }) {
  const { data, series, height = 260, stacked = false, className } = props
  const id = React.useId().replace(/:/g, "")
  const axes = useAxes(props)

  return (
    <ChartContainer config={toConfig(series)} className={cn("aspect-auto w-full", className)} style={{ height }}>
      <BarChart data={data as Row[]} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap={stacked ? "22%" : "18%"} barGap={2}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${id}-bar-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor(s.color)} stopOpacity={0.95} />
              <stop offset="100%" stopColor={chartColor(s.color)} stopOpacity={0.35} />
            </linearGradient>
          ))}
        </defs>
        {axes.grid}
        {axes.x}
        {axes.y}
        {axes.tooltip({ fill: "var(--foreground)", fillOpacity: 0.05, radius: 6 })}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "stack" : undefined}
            fill={`url(#${id}-bar-${s.key})`}
            // In a stack only the top segment is rounded.
            radius={!stacked || i === series.length - 1 ? [4, 4, 1, 1] : [1, 1, 1, 1]}
            maxBarSize={28}
            animationDuration={900}
            animationEasing="ease-out"
            animationBegin={i * 120}
          />
        ))}
        {axes.pill}
      </BarChart>
    </ChartContainer>
  )
}
