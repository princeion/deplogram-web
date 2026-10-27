const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** "2026-09-24" → "24 Sep 2026". UTC so server and client render identically. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`))
}

/** "https://storefront.deplogram.app/" → "storefront.deplogram.app". The backend sends full URLs; the UI shows hosts. */
export function toHost(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" })

/** ISO timestamp → "just now" · "5m ago" · "3h ago" · "yesterday" · "4d ago", then a date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return "just now"
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), "minute")
  if (abs < 86_400) return relativeFormatter.format(Math.round(seconds / 3600), "hour")
  if (abs < 86_400 * 7) return relativeFormatter.format(Math.round(seconds / 86_400), "day")
  return formatDate(iso.slice(0, 10))
}

/** 74 → "1m 14s", 36 → "36s". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const numberFormatter = new Intl.NumberFormat("en")

/** 4120 → "4.1K", 2_400_000 → "2.4M". For axes, stats and anywhere space is tight. */
export function formatCompact(value: number): string {
  return compactFormatter.format(value)
}

/** 18420 → "18,420". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** Decimal units, as plan limits are written: 8_400_000_000 → "8.4 GB". */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit++
  }
  return `${unit === 0 ? value : Number(value.toFixed(fractionDigits))} ${units[unit]}`
}

/** 0.0731 → "7.3%". */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${Number((ratio * 100).toFixed(fractionDigits))}%`
}
