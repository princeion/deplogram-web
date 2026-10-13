import type * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

// Three source gradients × four orientations — so stages next to each other never look identical.
const sources = {
  ember: "/images/gradient-ember.webp",
  flow: "/images/gradient-flow.webp",
  lime: "/images/gradient-lime.webp",
} as const

const variants = {
  a: "",
  b: "-scale-x-100",
  c: "rotate-180",
  d: "-scale-y-100",
} as const

export type GradientSource = keyof typeof sources
export type GradientVariant = keyof typeof variants

type GradientStageProps = {
  children?: React.ReactNode
  className?: string
  variant?: GradientVariant
  source?: GradientSource
}

/** Picks a source + orientation for the nth item in a grid, cycling through the images. */
export function gradientFor(index: number): { source: GradientSource; variant: GradientVariant } {
  const order = ["a", "b", "c", "d"] as const
  const cycle = ["ember", "flow", "lime"] as const
  return { source: cycle[index % cycle.length], variant: order[Math.floor(index / cycle.length) % order.length] }
}

/**
 * The brand gradient as a stage for product UI (OpenAI/Codex style): a rounded panel filled with
 * one of the brand gradients, children float on top. Everything placed on it should use the `glass` recipe.
 */
export function GradientStage({ children, className, variant = "a", source = "ember" }: GradientStageProps) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-3xl", className)}>
      <Image
        src={sources[source]}
        alt=""
        fill
        sizes="(min-width: 1280px) 1280px, 100vw"
        className={cn("-z-10 object-cover", variants[variant])}
      />
      {children}
    </div>
  )
}
