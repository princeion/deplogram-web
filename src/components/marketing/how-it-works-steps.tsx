"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion, useScroll, useSpring } from "motion/react"

import { entrance } from "@/lib/motion"
import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { NodeDot } from "@/components/shared/node-graph"
import { InlineText } from "@/components/marketing/inline-text"

/** Ordered steps on a rail that fills with scroll; each step's node lights as it's reached. */
export function HowItWorksSteps({ steps }: { steps: readonly FeatureItem[] }) {
  const ref = React.useRef<HTMLOListElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <ol ref={ref} className="relative flex flex-col gap-10">
      <div aria-hidden className="absolute top-2 bottom-2 left-[4.5px] w-px bg-border" />
      <motion.div
        aria-hidden
        className="absolute top-2 bottom-2 left-[4.5px] w-px origin-top bg-brand-ink"
        style={{ scaleY: reduceMotion ? 1 : fill }}
      />
      {steps.map((step, i) => (
        <Step key={step.title} step={step} index={i} />
      ))}
    </ol>
  )
}

function Step({ step, index }: { step: FeatureItem; index: number }) {
  const ref = React.useRef<HTMLLIElement>(null)
  const reached = useInView(ref, { once: true, margin: "0px 0px -40% 0px" })
  const reduceMotion = useReducedMotion()

  return (
    <motion.li
      ref={ref}
      className="relative flex gap-6 pl-0"
      initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={entrance}
    >
      <NodeDot lit={reached} className="relative mt-1.5" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <Icon name={step.icon} className="text-brand-ink" />
        </div>
        <h3 className="font-heading text-subheading font-semibold">{step.title}</h3>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          <InlineText text={step.description} />
        </p>
      </div>
    </motion.li>
  )
}
