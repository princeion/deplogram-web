"use client"

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT, STAGGER, VIEWPORT } from "@/lib/motion"
import { accentClass } from "@/components/shared/accent-text"

type TextRevealProps = {
  /** Headline markup: `*words*` render as the serif-italic accent, "\n" forces a line break. */
  text: string
  as?: "h1" | "h2" | "p"
  className?: string
  delay?: number
  /** Animate on mount instead of when scrolled into view (above-the-fold heroes). */
  immediate?: boolean
}

type Word = { text: string; accent: boolean }

function parse(text: string): Word[][] {
  let accent = false
  return text.split("\n").map((line) =>
    line
      .split(" ")
      .filter(Boolean)
      .map((raw) => {
        const opens = raw.startsWith("*")
        const closes = raw.endsWith("*") && (raw.length > 1 || !opens)
        if (opens) accent = true
        const word = { text: raw.replaceAll("*", ""), accent }
        if (closes) accent = false
        return word
      })
  )
}

/**
 * Word-by-word headline reveal: each word rises out of its own clipping line.
 * Reduced motion → a plain fade.
 */
export function TextReveal({ text, as = "h1", className, delay = 0, immediate = false }: TextRevealProps) {
  const reduceMotion = useReducedMotion()
  const lines = parse(text)

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER * 1.2, delayChildren: delay } },
  }
  const word: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: DURATION.base } } }
    : {
        hidden: { y: "110%" },
        show: { y: "0%", transition: { duration: DURATION.slow + 0.3, ease: EASE_OUT } },
      }

  const Tag = motion[as]
  const trigger = immediate ? { animate: "show" } : { whileInView: "show", viewport: VIEWPORT }

  return (
    <Tag className={className} variants={container} initial="hidden" {...trigger}>
      {lines.map((words, lineIndex) => (
        <span key={lineIndex} className="block">
          {words.map((w, i) => (
            <React.Fragment key={`${w.text}-${i}`}>
              <span className="inline-flex overflow-hidden pb-[0.1em] align-bottom">
                <motion.span variants={word} className={cn("inline-block", w.accent && accentClass)}>
                  {w.text}
                </motion.span>
              </span>
              {i < words.length - 1 && " "}
            </React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}
