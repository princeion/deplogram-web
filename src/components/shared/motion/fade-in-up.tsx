"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { entrance, VIEWPORT } from "@/lib/motion"

type FadeInUpProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Travel distance in px (16–24 per the motion spec). */
  distance?: number
}

/** Default entrance: fade + rise into view, once. */
export function FadeInUp({ children, className, delay = 0, distance = 20 }: FadeInUpProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ ...entrance, delay }}
    >
      {children}
    </motion.div>
  )
}
