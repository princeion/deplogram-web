"use client"

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { entrance, STAGGER, VIEWPORT } from "@/lib/motion"

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: entrance },
}

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: entrance },
}

type StaggerGroupProps = {
  children: React.ReactNode
  className?: string
  as?: "div" | "ul" | "ol"
}

/** Parent that staggers its StaggerItem children into view, once. */
export function StaggerGroup({ children, className, as = "div" }: StaggerGroupProps) {
  const shared = {
    className,
    variants: groupVariants,
    initial: "hidden",
    whileInView: "show",
    viewport: VIEWPORT,
  } as const
  if (as === "ul") return <motion.ul {...shared}>{children}</motion.ul>
  if (as === "ol") return <motion.ol {...shared}>{children}</motion.ol>
  return <motion.div {...shared}>{children}</motion.div>
}

type StaggerItemProps = {
  children: React.ReactNode
  className?: string
  as?: "div" | "li"
}

export function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const reduceMotion = useReducedMotion()
  const variants = reduceMotion ? reducedItemVariants : itemVariants
  if (as === "li")
    return (
      <motion.li className={className} variants={variants}>
        {children}
      </motion.li>
    )
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}
