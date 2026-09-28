"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { SPRING } from "@/lib/motion"

type HoverScaleProps = {
  children: React.ReactNode
  className?: string
  scale?: number
}

/** Spring-based lift on hover for cards and pills. Border/glow changes stay in the child's CSS. */
export function HoverScale({ children, className, scale = 1.02 }: HoverScaleProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      whileHover={reduceMotion ? undefined : { scale, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={SPRING.snappy}
    >
      {children}
    </motion.div>
  )
}
