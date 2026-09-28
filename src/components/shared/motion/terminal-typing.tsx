"use client"

import * as React from "react"
import { useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

export type TerminalLineKind = "command" | "info" | "success" | "muted"

export type TerminalLine = {
  text: string
  kind: TerminalLineKind
  /** Progress value reported via onProgress once this line has printed. */
  step?: number
}

type TerminalTypingProps = {
  lines: readonly TerminalLine[]
  /** Called with the latest `step` as lines print, and with 0 when the loop restarts. */
  onProgress?: (step: number) => void
  loop?: boolean
  className?: string
}

const CHAR_MS = 32
const LINE_MS = 420
const RESTART_MS = 3600

const prefix: Record<TerminalLineKind, string> = {
  command: "$",
  info: "→",
  success: "✓",
  muted: " ",
}

/**
 * Types a sequence of terminal lines: commands character-by-character, output line-by-line,
 * with a blinking cursor. Pauses off-screen. Reduced motion → every line shown at once.
 */
export function TerminalTyping({ lines, onProgress, loop = true, className }: TerminalTypingProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduceMotion = useReducedMotion()
  const [lineIndex, setLineIndex] = React.useState(0)
  const [charIndex, setCharIndex] = React.useState(0)
  const onProgressRef = React.useRef(onProgress)
  React.useEffect(() => {
    onProgressRef.current = onProgress
  })

  const done = lineIndex >= lines.length

  React.useEffect(() => {
    if (!reduceMotion) return
    const lastStep = [...lines].reverse().find((l) => l.step !== undefined)?.step
    if (lastStep !== undefined) onProgressRef.current?.(lastStep)
  }, [reduceMotion, lines])

  React.useEffect(() => {
    if (reduceMotion || !inView) return

    if (done) {
      if (!loop) return
      const id = window.setTimeout(() => {
        setLineIndex(0)
        setCharIndex(0)
        onProgressRef.current?.(0)
      }, RESTART_MS)
      return () => window.clearTimeout(id)
    }

    const line = lines[lineIndex]
    const typing = line.kind === "command" && charIndex < line.text.length
    const id = window.setTimeout(
      () => {
        if (typing) {
          setCharIndex((c) => c + 1)
          return
        }
        if (line.step !== undefined) onProgressRef.current?.(line.step)
        setLineIndex((i) => i + 1)
        setCharIndex(0)
      },
      typing ? CHAR_MS : LINE_MS
    )
    return () => window.clearTimeout(id)
  }, [reduceMotion, inView, done, loop, lines, lineIndex, charIndex])

  const shownLines = reduceMotion ? lines.length : lineIndex

  return (
    <div ref={ref} className={cn("relative", className)}>
      <p className="sr-only">{lines.map((l) => l.text).join(". ")}</p>
      <div aria-hidden className="space-y-1">
        {lines.map((line, i) => {
          const isCurrent = !reduceMotion && i === lineIndex
          const printed = i < shownLines
          const text = printed ? line.text : isCurrent && line.kind === "command" ? line.text.slice(0, charIndex) : ""
          const visible = printed || (isCurrent && line.kind === "command")
          return (
            <div key={i} className={cn("flex gap-3 whitespace-pre-wrap", !visible && "invisible")}>
              <span
                className={cn(
                  "w-3 shrink-0 select-none",
                  line.kind === "success" ? "text-brand-ink" : "text-muted-foreground"
                )}
              >
                {prefix[line.kind]}
              </span>
              <span
                className={cn(
                  "min-w-0 wrap-break-word",
                  line.kind === "command" && "text-foreground",
                  line.kind === "info" && "text-muted-foreground",
                  line.kind === "success" && "text-brand-ink",
                  line.kind === "muted" && "text-muted-foreground/70"
                )}
              >
                {/* Reserve the full line's height while it types so nothing reflows. */}
                {visible ? text : line.text}
                {isCurrent && <Cursor />}
              </span>
            </div>
          )
        })}
        {(done || reduceMotion) && (
          <div className="flex gap-3">
            <span className="w-3 shrink-0 text-muted-foreground">$</span>
            <Cursor />
          </div>
        )}
      </div>
    </div>
  )
}

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-[1.1em] w-2 translate-y-[0.15em] animate-blink bg-brand-ink motion-reduce:animate-none" />
  )
}
