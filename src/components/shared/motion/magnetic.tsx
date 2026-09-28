"use client"

import * as React from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react"

import { cn } from "@/lib/utils"
import { SPRING } from "@/lib/motion"

type MagneticProps = {
  children: React.ReactNode
  className?: string
  /** Fraction of the cursor offset the element follows. */
  strength?: number
}

/** Pulls its child toward the cursor while hovered, springs back on leave. Primary CTAs only. */
export function Magnetic({ children, className, strength = 0.25 }: MagneticProps) {
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, SPRING.magnetic)
  const springY = useSpring(y, SPRING.magnetic)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  function reset() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      className={cn("inline-flex", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
