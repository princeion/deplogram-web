/** A run of text with the ANSI styles that apply to it. */
export type AnsiSegment = { text: string; className?: string }

// Map the 16 basic SGR colours onto theme colours, so build output reads in both themes.
const foreground: Record<number, string> = {
  30: "text-muted-foreground",
  31: "text-destructive",
  32: "text-success",
  33: "text-brand-ink",
  34: "text-sky-500",
  35: "text-fuchsia-400",
  36: "text-cyan-500",
  37: "text-foreground",
  90: "text-muted-foreground",
  91: "text-destructive",
  92: "text-success",
  93: "text-brand-ink",
  94: "text-sky-400",
  95: "text-fuchsia-300",
  96: "text-cyan-400",
  97: "text-foreground",
}

const ANSI = /\x1b\[([\d;]*)m/g

/** Splits a line on ANSI SGR codes (colour, bold, dim, underline); other escapes are dropped. */
export function parseAnsi(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = []
  let color: string | undefined
  let bold = false
  let dim = false
  let underline = false
  let last = 0
  const push = (text: string) => {
    if (!text) return
    const className = [color, bold && "font-semibold", dim && "opacity-60", underline && "underline"].filter(Boolean).join(" ")
    segments.push({ text, className: className || undefined })
  }
  for (const match of input.matchAll(ANSI)) {
    push(input.slice(last, match.index))
    last = match.index! + match[0].length
    for (const code of (match[1] || "0").split(";").map(Number)) {
      if (code === 0) [color, bold, dim, underline] = [undefined, false, false, false]
      else if (code === 1) bold = true
      else if (code === 2) dim = true
      else if (code === 4) underline = true
      else if (code === 22) [bold, dim] = [false, false]
      else if (code === 24) underline = false
      else if (code === 39) color = undefined
      else if (foreground[code]) color = foreground[code]
    }
  }
  push(input.slice(last))
  return segments
}

/** The text without ANSI codes — for search, copy and download. */
export const stripAnsi = (input: string) => input.replace(/\x1b\[[\d;]*[A-Za-z]/g, "")
