import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { FeatureItem } from "@/content/types"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { FeatureCard } from "@/components/marketing/feature-card"

const gridVariants = cva("grid gap-4", {
  variants: {
    columns: {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: { columns: 3 },
})

type FeatureGridProps = VariantProps<typeof gridVariants> & {
  items: readonly FeatureItem[]
  className?: string
}

/** Data-driven Surface card grid — the `cards` feature layout (values, perks, billing model). */
export function FeatureGrid({ items, columns, className }: FeatureGridProps) {
  return (
    <StaggerGroup as="ul" className={cn(gridVariants({ columns }), className)}>
      {items.map((item) => (
        <StaggerItem as="li" key={item.title}>
          <HoverScale className="h-full" scale={1.015}>
            <FeatureCard item={item} />
          </HoverScale>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
