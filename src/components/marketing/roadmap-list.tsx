import { cn } from "@/lib/utils"
import { roadmapStatusLabel, type RoadmapPhase, type RoadmapStatus } from "@/content/roadmap"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

const statusTone: Record<RoadmapStatus, string> = {
  done: "bg-foreground text-background",
  now: "bg-brand text-brand-foreground",
  next: "elevation-control text-foreground",
  later: "elevation-control text-muted-foreground",
}

export function RoadmapStatusChip({ status, className }: { status: RoadmapStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap", statusTone[status], className)}>
      {status === "now" && <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-current motion-reduce:animate-none" />}
      {status === "done" && <Icon name="check" size="xs" />}
      {roadmapStatusLabel[status]}
    </span>
  )
}

/** The phases as Surface cards. `detailed` adds the description and items (the roadmap page). */
export function RoadmapList({ phases, detailed = false }: { phases: readonly RoadmapPhase[]; detailed?: boolean }) {
  return (
    <StaggerGroup as="ol" className={cn("grid gap-4", !detailed && "sm:grid-cols-2 lg:grid-cols-4")}>
      {phases.map((phase) => (
        <StaggerItem
          as="li"
          key={phase.phase}
          className={cn(
            "flex flex-col gap-4 rounded-2xl elevation-surface p-6",
            detailed && "sm:p-8 lg:grid lg:grid-cols-[14rem_1fr_1fr] lg:items-start lg:gap-10",
            phase.status === "now" && "border-brand-ink/60 ring-1 ring-brand-ink/20"
          )}
        >
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
            <span className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
              {phase.phase} · {phase.name}
            </span>
            <RoadmapStatusChip status={phase.status} />
          </div>
          <div className="grid gap-2">
            <p className={cn("font-heading text-subheading font-semibold", phase.status === "later" && "text-muted-foreground")}>{phase.title}</p>
            {detailed ? (
              <p className="text-pretty text-muted-foreground">{phase.description}</p>
            ) : (
              <p className="text-sm text-pretty text-muted-foreground">{phase.items[0]}</p>
            )}
          </div>
          {detailed && (
            <ul className="grid gap-2.5 text-sm">
              {phase.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <Icon name="check" className={cn("mt-0.5", phase.status === "done" ? "text-brand-ink" : "text-muted-foreground")} />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
