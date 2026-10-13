import type * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** Icon + title + one-liner, stacked — sits beside a product window. */
export function FeatureStack({ items, className }: { items: readonly FeatureItem[]; className?: string }) {
  return (
    <StaggerGroup as="ul" className={cn("flex flex-col gap-6", className)}>
      {items.map((item) => (
        <StaggerItem as="li" key={item.title} className="flex gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg elevation-control text-brand-ink">
            <Icon name={item.icon} size="md" />
          </span>
          <div className="grid gap-1">
            <p className="font-heading text-subheading font-medium">{item.title}</p>
            <p className="text-sm text-pretty text-muted-foreground">{item.description}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}

/** "More" link closing a section. */
export function SectionLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline", className)}
    >
      {children}
      <Icon name="arrow-right" size="xs" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
    </Link>
  )
}
