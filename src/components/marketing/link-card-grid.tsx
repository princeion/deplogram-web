import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import type { IconName } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { SpotlightCard } from "@/components/shared/motion/spotlight-card"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

export type LinkCardItem = {
  title: string
  description: string
  href: string
  icon: IconName
}

const gridVariants = cva("grid gap-4", {
  variants: {
    columns: {
      2: "sm:grid-cols-2",
      5: "sm:grid-cols-2 lg:grid-cols-5",
    },
  },
  defaultVariants: { columns: 2 },
})

type LinkCardGridProps = VariantProps<typeof gridVariants> & {
  items: readonly LinkCardItem[]
  className?: string
}

/** FeatureCard-style surfaces that navigate. Used by the docs index (2 columns) and the homepage pillars (5). */
export function LinkCardGrid({ items, columns, className }: LinkCardGridProps) {
  return (
    <StaggerGroup as="ul" className={cn(gridVariants({ columns }), className)}>
      {items.map((item) => (
        <StaggerItem as="li" key={item.href}>
          <HoverScale className="h-full" scale={1.015}>
            <SpotlightCard className="h-full">
              <Link href={item.href} className="group flex h-full flex-col gap-4 rounded-2xl p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="flex size-10 items-center justify-center rounded-lg elevation-control text-brand-ink">
                  <Icon name={item.icon} size="md" />
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-2 font-heading text-subheading font-medium">
                    {item.title}
                    <Icon
                      name="arrow-right"
                      className="text-muted-foreground transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="text-sm text-pretty text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            </SpotlightCard>
          </HoverScale>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
