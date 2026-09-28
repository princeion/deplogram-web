import { cn } from "@/lib/utils"
import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { InlineText } from "@/components/marketing/inline-text"

/**
 * Numbered spec sheet: features as cells of one hairline grid, no individual cards.
 * Use a count that fills every row (3 columns at lg, 2 at sm) — see "Hairline grid" in the design system.
 */
export function FeatureMatrix({ items, className }: { items: readonly FeatureItem[]; className?: string }) {
  return (
    <StaggerGroup as="ul" className={cn("hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, i) => (
        // Cells stay opaque (a fading cell would flash the rule colour); only their content staggers in.
        <li key={item.title} className="hairline-cell">
          <StaggerItem className="flex h-full flex-col gap-3 p-6 sm:p-8">
            <div className="mb-3 flex items-center justify-between">
              <Icon name={item.icon} size="md" className="text-brand-ink" />
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="font-heading text-subheading font-semibold">{item.title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              <InlineText text={item.description} />
            </p>
          </StaggerItem>
        </li>
      ))}
    </StaggerGroup>
  )
}
