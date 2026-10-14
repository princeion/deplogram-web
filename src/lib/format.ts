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
