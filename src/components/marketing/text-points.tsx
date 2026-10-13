import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { IconName } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { InlineText } from "@/components/marketing/inline-text"

export type TextPoint = {
  title: string
  description: string
  icon?: IconName
  /** A short mono line under the description, e.g. an endpoint. */
  meta?: string
}

const gridVariants = cva("grid gap-x-8 gap-y-10", {
  variants: {
    columns: {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: { columns: 3 },
})

type TextPointsProps = VariantProps<typeof gridVariants> & {
  items: readonly TextPoint[]
  /** Number the points (01, 02 …) instead of showing icons — for sequential steps. */
  numbered?: boolean
  className?: string
}

/**
 * Text-led points: a hairline, a small icon or step number, a title and a short explanation.
 * Reads well at any width — the default way to explain something on this site.
 */
export function TextPoints({ items, columns, numbered = false, className }: TextPointsProps) {
  return (
    <StaggerGroup as={numbered ? "ol" : "ul"} className={cn(gridVariants({ columns }), className)}>
      {items.map((item, i) => (
        <StaggerItem as="li" key={item.title} className="flex flex-col gap-3 border-t border-border/70 pt-6">
          {numbered ? (
            <span className="font-mono text-xs tracking-eyebrow text-brand-ink">{String(i + 1).padStart(2, "0")}</span>
          ) : (
            item.icon && <Icon name={item.icon} size="md" className="text-brand-ink" />
          )}
          <h3 className="font-heading text-subheading font-medium">{item.title}</h3>
          <p className="text-pretty text-muted-foreground">
            <InlineText text={item.description} />
          </p>
          {item.meta && <code className="font-mono text-xs text-muted-foreground">{item.meta}</code>}
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
