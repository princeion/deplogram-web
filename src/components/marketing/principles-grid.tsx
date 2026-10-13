import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** Numbered principle cells on a 3-column hairline grid (fills every row: pass multiples of 3). */
export function PrinciplesGrid({ items }: { items: readonly FeatureItem[] }) {
  return (
    <StaggerGroup as="ol" className="hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <StaggerItem as="li" key={item.title} className="hairline-cell flex min-h-60 flex-col justify-between gap-10 p-5 hover:bg-card sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-eyebrow text-brand-ink">{String(i + 1).padStart(3, "0")}.</span>
            <Icon name={item.icon} className="text-muted-foreground" />
          </div>
          <div className="grid gap-2">
            <p className="font-heading text-2xl font-medium tracking-tight text-balance">{item.title}</p>
            <p className="text-sm text-pretty text-muted-foreground">{item.description}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
