import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionVariants = cva("relative", {
  variants: {
    spacing: {
      default: "py-20 sm:py-24 lg:py-32",
      compact: "py-12 sm:py-16",
    },
  },
  defaultVariants: { spacing: "default" },
})

type SectionWrapperProps = React.ComponentProps<"section"> & VariantProps<typeof sectionVariants>

/** Consistent vertical rhythm between sections. */
export function SectionWrapper({ className, spacing, ...props }: SectionWrapperProps) {
  return <section className={cn(sectionVariants({ spacing }), className)} {...props} />
}
