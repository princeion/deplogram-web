import { utilities } from "@/content/tools"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** The six utilities on a 3×2 hairline grid — numbered cells, a sample of what each one handles. */
export function UtilitiesGrid() {
  return (
    <StaggerGroup as="ul" className="hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {utilities.map((utility, i) => (
        <StaggerItem as="li" key={utility.title} className="hairline-cell group flex min-h-52 flex-col justify-between gap-8 p-5 hover:bg-card sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-10 items-center justify-center rounded-lg elevation-control transition-colors group-hover:border-brand group-hover:text-brand-ink">
              <Icon name={utility.icon} size="md" />
            </span>
            <span className="font-mono text-xs tracking-eyebrow text-muted-foreground">U/{String(i + 1).padStart(2, "0")}</span>
          </div>
          <div className="grid gap-2">
            <p className="font-heading text-xl font-semibold tracking-tight">{utility.title}</p>
            <p className="text-sm text-muted-foreground">{utility.description}</p>
            <code className="mt-2 w-fit rounded-md border border-border/70 bg-card px-2 py-1 font-mono text-[0.6875rem] text-muted-foreground">{utility.sample}</code>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
