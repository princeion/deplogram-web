"use client"

import * as React from "react"
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react"

import { EASE_OUT } from "@/lib/motion"

type AnimatedCounterProps = {
  value: number
  suffix?: string
  className?: string
  duration?: number
}

/** Counts up from 0 when scrolled into view, once. Reduced motion → final value immediately. */
export function AnimatedCounter({ value, suffix = "", className, duration = 1.4 }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const count = useMotionValue(reduceMotion ? value : 0)
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`)

  React.useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      count.set(value)
      return
    }
    const controls = animate(count, value, { duration, ease: EASE_OUT })
    return () => controls.stop()
  }, [inView, reduceMotion, value, duration, count])

  return (
    <span className={className}>
      <motion.span ref={ref} aria-hidden>
        {rounded}
      </motion.span>
      <span className="sr-only">{`${value}${suffix}`}</span>
    </span>
  )
}
