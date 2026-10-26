/**
 * Five-field cron (minute hour day-of-month month day-of-week): parse, describe in plain English,
 * and list the next runs. Supports *, lists (1,15), ranges (1-5), steps (*\/15, 0-30/10), month and
 * weekday names (JAN, MON), 7 as Sunday, and the shortcuts @hourly, @daily, @weekly, @monthly,
 * @yearly. Day-of-month and day-of-week follow the usual rule: if both are restricted, a day
 * matching either runs.
 */

type Field = { name: string; min: number; max: number; names?: string[] }

const FIELDS: Field[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day of the month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] },
  { name: "day of the week", min: 0, max: 7, names: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] },
]

const SHORTCUTS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
}

export type ParsedCron = { fields: Set<number>[]; raw: string[]; any: boolean[] }

function parseField(text: string, field: Field): { values: Set<number>; any: boolean } {
  const values = new Set<number>()
  const value = (token: string) => {
    const upper = token.toUpperCase()
    const named = field.names?.indexOf(upper) ?? -1
    if (named >= 0) return named + (field.name === "month" ? 1 : 0)
    if (!/^\d+$/.test(token)) throw new Error(`“${token}” isn't a valid ${field.name}.`)
    const n = Number(token)
    if (n < field.min || n > field.max) throw new Error(`The ${field.name} must be between ${field.min} and ${field.max} — got ${n}.`)
    return n
  }
  for (const part of text.split(",")) {
    if (!part) throw new Error(`The ${field.name} has an empty item.`)
    const [range, stepText] = part.split("/")
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) throw new Error(`“/${stepText}” isn't a valid step for the ${field.name}.`)
    let start: number
    let end: number
    if (range === "*") {
      start = field.min
      end = field.max
    } else if (range.includes("-")) {
      const [a, b] = range.split("-")
      start = value(a)
      end = value(b)
      if (start > end) throw new Error(`In the ${field.name}, ${a}-${b} runs backwards.`)
    } else {
      start = value(range)
      end = stepText === undefined ? start : field.max
    }
    for (let n = start; n <= end; n += step) values.add(field.name === "day of the week" && n === 7 ? 0 : n)
  }
  return { values, any: text === "*" }
}

export function parseCron(expression: string): ParsedCron {
  const trimmed = expression.trim()
  const expanded = SHORTCUTS[trimmed.toLowerCase()] ?? trimmed
  const raw = expanded.split(/\s+/)
  if (raw.length !== 5) throw new Error(`Cron has five fields (minute hour day month weekday) — this has ${raw.filter(Boolean).length}.`)
  const parsed = raw.map((text, i) => parseField(text, FIELDS[i]))
  return { fields: parsed.map((p) => p.values), raw, any: parsed.map((p) => p.any) }
}

/** The next `count` runs after `from`, in local time (or UTC). */
export function nextRuns(cron: ParsedCron, count: number, from = new Date(), utc = false): Date[] {
  const [minutes, hours, days, months, weekdays] = cron.fields
  const domAny = cron.any[2]
  const dowAny = cron.any[4]
  const runs: Date[] = []
  const d = new Date(from)
  d.setSeconds(0, 0)
  const get = (date: Date) =>
    utc
      ? { mo: date.getUTCMonth() + 1, day: date.getUTCDate(), wd: date.getUTCDay(), h: date.getUTCHours(), mi: date.getUTCMinutes() }
      : { mo: date.getMonth() + 1, day: date.getDate(), wd: date.getDay(), h: date.getHours(), mi: date.getMinutes() }
  const add = (ms: number) => d.setTime(d.getTime() + ms)
  add(60_000)
  // Walk forward, skipping whole days and hours that can't match; give up after ~5 years.
  for (let guard = 0; guard < 500_000 && runs.length < count; guard++) {
    const t = get(d)
    const dayOk = domAny && dowAny ? true : domAny ? weekdays.has(t.wd) : dowAny ? days.has(t.day) : days.has(t.day) || weekdays.has(t.wd)
    if (!months.has(t.mo) || !dayOk) {
      add((24 * 60 - (t.h * 60 + t.mi)) * 60_000)
      continue
    }
    if (!hours.has(t.h)) {
      add((60 - t.mi) * 60_000)
      continue
    }
    if (minutes.has(t.mi)) runs.push(new Date(d))
    add(60_000)
  }
  return runs
}

// ── Plain English ───────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0")
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4] ?? "th"}`

function list(words: string[]) {
  return words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`
}

function stepOf(raw: string) {
  const m = raw.match(/^\*\/(\d+)$/)
  return m ? Number(m[1]) : null
}

export function describeCron(cron: ParsedCron): string {
  const [mi, h, dom, mo, dow] = cron.raw
  const minutes = [...cron.fields[0]].sort((a, b) => a - b)
  const hours = [...cron.fields[1]].sort((a, b) => a - b)

  let time: string
  if (mi === "*" && h === "*") time = "Every minute"
  else if (stepOf(mi) && h === "*") time = `Every ${stepOf(mi)} minutes`
  else if (h === "*") time = `At minute ${list(minutes.map(String))} of every hour`
  else if (stepOf(h) && minutes.length === 1) time = `Every ${stepOf(h)} hours at minute ${minutes[0]}`
  else if (mi === "*") time = `Every minute during ${list(hours.map((x) => `${pad(x)}:00`))}`
  else if (hours.length * minutes.length <= 6) time = `At ${list(hours.flatMap((x) => minutes.map((m) => `${pad(x)}:${pad(m)}`)))}`
  else time = `At minute ${list(minutes.map(String))} past ${list(hours.map((x) => pad(x)))}h`

  const parts = [time]
  const weekdays = [...cron.fields[4]].sort((a, b) => a - b)
  if (dow !== "*") {
    if (weekdays.join() === "1,2,3,4,5") parts.push("on weekdays (Monday to Friday)")
    else if (weekdays.join() === "0,6") parts.push("on weekends")
    else parts.push(`on ${list(weekdays.map((d) => DAYS[d]))}`)
  }
  if (dom !== "*") {
    const days = [...cron.fields[2]].sort((a, b) => a - b)
    parts.push(`${dow !== "*" ? "or " : ""}on the ${list(days.map(ordinal))} of the month`)
  }
  if (mo !== "*") parts.push(`in ${list([...cron.fields[3]].sort((a, b) => a - b).map((m) => MONTHS[m - 1]))}`)
  return parts.join(", ") + "."
}

/** Common schedules to start from. */
export const cronPresets: { label: string; expression: string }[] = [
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every day at 09:00", expression: "0 9 * * *" },
  { label: "Weekdays at 09:00", expression: "0 9 * * 1-5" },
  { label: "Every Monday at 08:30", expression: "30 8 * * 1" },
  { label: "1st of the month at midnight", expression: "0 0 1 * *" },
]
