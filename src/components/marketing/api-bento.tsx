import { cn } from "@/lib/utils"
import type { ApiItem } from "@/content/apis"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { ApiVisual } from "@/components/marketing/api-visuals"

/**
 * Bento grid of the APIs on one hairline grid. `wide` cells span two columns and, at lg, sit text-left /
 * visual-right; narrow cells stack text over visual. Order the data so every row fills (see apis.ts).
 */
export function ApiBento({ apis, className }: { apis: readonly ApiItem[]; className?: string }) {
  return (
    <StaggerGroup as="ul" className={cn("hairline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", className)}>
      {apis.map((api) => (
        // Cells stay opaque (a fading cell would flash the rule colour); only their content staggers in.
        <li key={api.id} className={cn("hairline-cell", api.wide && "md:col-span-2")}>
          <StaggerItem
            className={cn(
              "flex h-full flex-col gap-8 p-6 sm:p-8",
              api.wide && "lg:flex-row lg:items-center lg:gap-10"
            )}
          >
            <div className={cn("flex flex-col gap-2", api.wide && "lg:w-2/5 lg:shrink-0")}>
              <Icon name={api.icon} size="md" className="mb-2 text-brand-ink" />
              <h3 className="font-heading text-subheading font-semibold">{api.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{api.description}</p>
            </div>
            <div aria-hidden className={cn("mt-auto flex min-w-0 justify-center", api.wide && "lg:mt-0 lg:flex-1")}>
              <div className="w-full min-w-0">
                <ApiVisual id={api.id} />
              </div>
            </div>
          </StaggerItem>
        </li>
      ))}
    </StaggerGroup>
  )
}
