import type { Transition } from "motion/react"

/** Shared motion vocabulary — see "Motion" in docs/design-system.md. Mirrored as --ease-out-expo in CSS. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const DURATION = {
  fast: 0.3,
  base: 0.5,
  slow: 0.6,
} as const

export const STAGGER = 0.06

export const SPRING = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  magnetic: { type: "spring", stiffness: 200, damping: 18, mass: 0.2 },
} as const satisfies Record<string, Transition>

/** Every whileInView entrance fires once. */
export const VIEWPORT = { once: true, amount: 0.2 } as const

export const entrance: Transition = { duration: DURATION.base, ease: EASE_OUT }
