"use client"

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { cn } from "@/lib/utils"
import { DURATION, EASE_OUT, STAGGER, VIEWPORT } from "@/lib/motion"

type TextRevealProps = {
  text: string
  as?: "h1" | "h2" | "p"
  className?: string
  /** Words (exact match, incl. punctuation) rendered in the brand ink. */
  highlight?: readonly string[]
  delay?: number
}

/**
 * Word-by-word headline reveal: each word rises out of its own clipping line.
 * A "\n" in `text` forces a line break (each line renders as a block).
 */
export function TextReveal({ text, as = "h1", className, highlight = [], delay = 0 }: TextRevealProps) {
  const reduceMotion = useReducedMotion()
  const lines = text.split("\n").map((line) => line.split(" "))

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER * 1.4, delayChildren: delay } },
  }
  const word: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: DURATION.base } } }
    : {
        hidden: { y: "105%", opacity: 0 },
        show: { y: "0%", opacity: 1, transition: { duration: DURATION.slow + 0.2, ease: EASE_OUT } },
      }

  const Tag = motion[as]

  return (
    <Tag className={className} variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {lines.map((words, lineIndex) => (
        <span key={lineIndex} className={lines.length > 1 ? "block" : undefined}>
          {words.map((w, i) => (
            <React.Fragment key={`${w}-${i}`}>
              <span className="inline-flex overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  variants={word}
                  className={cn("inline-block", highlight.includes(w) && "text-brand-ink")}
                >
                  {w}
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
