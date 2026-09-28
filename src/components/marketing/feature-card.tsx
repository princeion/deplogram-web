import { cn } from "@/lib/utils"
import type { FeatureItem } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { SpotlightCard } from "@/components/shared/motion/spotlight-card"
import { InlineText } from "@/components/marketing/inline-text"

/** Icon tile + title + description on a Surface. Used for values, perks and the billing model. */
export function FeatureCard({ item, className }: { item: FeatureItem; className?: string }) {
  return (
    <SpotlightCard className={cn("h-full", className)}>
      <div className="flex h-full flex-col gap-4 p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg elevation-control text-brand-ink">
          <Icon name={item.icon} size="md" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-subheading font-semibold">{item.title}</h3>
          <p className="text-sm text-pretty text-muted-foreground">
            <InlineText text={item.description} />
          </p>
        </div>
      </div>
    </SpotlightCard>
  )
}
