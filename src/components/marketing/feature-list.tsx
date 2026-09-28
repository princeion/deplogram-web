import { cn } from "@/lib/utils"
import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { InlineText } from "@/components/marketing/inline-text"

/** Borderless icon list: many small items on the canvas, separated only by a top hairline. No cards. */
export function FeatureList({ items, className }: { items: readonly FeatureItem[]; className?: string }) {
  return (
    <StaggerGroup as="ul" className={cn("grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 lg:grid-cols-4", className)}>
      {items.map((item) => (
        <StaggerItem as="li" key={item.title} className="group flex flex-col gap-2 border-t border-border/70 pt-5">
          <Icon
            name={item.icon}
            className="mb-1 text-brand-ink transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5"
          />
          <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
          <p className="text-sm text-pretty text-muted-foreground">
            <InlineText text={item.description} />
          </p>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
