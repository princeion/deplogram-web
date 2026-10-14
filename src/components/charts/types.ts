/**
 * Charts are monochrome by default — greys from bright to dim — so data reads as shape, not
 * colour. `brand` is the accent: one series per chart at most, for the thing that matters now
 * (today, the current deployment, a limit being approached).
 */
export type ChartColor = "brand" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "success" | "destructive"

// Raw theme variables: Tailwind only emits `--color-*` for classes it sees, not inline styles.
export const chartColor = (color: ChartColor = "chart-1") => `var(--${color})`

export type ChartSeries<K extends string = string> = {
  /** Key in each data row. */
  key: K
  label: string
  color?: ChartColor
}

/** Formats a value for axes, tooltips and stats. */
export type ValueFormat = (value: number) => string
