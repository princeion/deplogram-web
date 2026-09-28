import Link from "next/link"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Plan } from "@/content/pricing"
import { buttonVariants } from "@/components/ui/button"
import { BadgePill } from "@/components/shared/badge-pill"
import { Icon } from "@/components/shared/icon"

// Documented Surface variant — see "Pricing card" in docs/design-system.md.
const pricingCardVariants = cva("relative flex h-full flex-col gap-6 rounded-2xl elevation-surface p-6", {
  variants: {
    highlighted: {
      true: "border-brand-ink/60 ring-1 ring-brand-ink/20",
      false: "",
    },
  },
  defaultVariants: { highlighted: false },
})

export function PricingCard({ plan }: { plan: Plan }) {
  const highlighted = plan.highlighted ?? false
  return (
    <div className={pricingCardVariants({ highlighted })}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-subheading font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.position}</p>
        </div>
        {highlighted && <BadgePill variant="brand">Recommended</BadgePill>}
      </div>
      <div>
        {plan.price ? (
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-heading font-semibold">{plan.price}</span>
            {plan.cadence && <span className="text-sm text-muted-foreground">{plan.cadence}</span>}
          </p>
        ) : (
          <p className="flex items-baseline gap-2">
            <span className="font-heading text-heading font-semibold">Custom</span>
            <span className="text-sm text-muted-foreground">talk to us</span>
          </p>
        )}
        <p className="mt-3 text-sm text-pretty text-muted-foreground">{plan.description}</p>
      </div>
      <Link
        href={plan.cta.href}
        className={cn(buttonVariants({ variant: highlighted ? "default" : plan.id === "freebies" ? "inverted" : "outline", size: "lg" }), "w-full")}
      >
        {plan.cta.label}
      </Link>
      <ul className="flex flex-col gap-3 border-t border-border/70 pt-6 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Icon name="check" className="mt-0.5 text-brand-ink" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
