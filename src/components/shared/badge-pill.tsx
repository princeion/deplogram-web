import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { NodeDot } from "@/components/shared/node-graph"

const badgePillVariants = cva(
  "inline-flex items-center gap-2 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "elevation-control text-muted-foreground",
        brand: "bg-brand text-brand-foreground",
        outline: "border border-border text-muted-foreground",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  }
)

type BadgePillProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgePillVariants> & {
    /** Leading lit node — the "live" signal. */
    dot?: boolean
  }

export function BadgePill({ className, variant, size, dot, children, ...props }: BadgePillProps) {
  return (
    <span className={cn(badgePillVariants({ variant, size }), className)} {...props}>
      {dot && <NodeDot lit />}
      {children}
    </span>
  )
}
