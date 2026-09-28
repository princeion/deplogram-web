import { cn } from "@/lib/utils"
import { statusLabel, type StatusService } from "@/content/status"
import { BadgePill } from "@/components/shared/badge-pill"
import { NodeDot, NodeGraph } from "@/components/shared/node-graph"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

export function StatusBoard({ services }: { services: readonly StatusService[] }) {
  const allOperational = services.every((service) => service.status === "operational")
  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-center gap-8 rounded-3xl elevation-surface p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col items-start gap-3">
          <BadgePill variant={allOperational ? "brand" : "default"}>
            {allOperational ? "All systems operational" : "Some systems degraded"}
          </BadgePill>
          <p className="max-w-md text-sm text-pretty text-muted-foreground">
            {/* TODO: replace with real-time status once monitoring is wired up. */}
            This page is a static preview. Live uptime history and incident updates arrive with monitoring.
          </p>
        </div>
        <NodeGraph
          layout="status"
          state="live"
          animated
          showLabels
          title="Platform services connected to the live edge"
          className="w-full max-w-sm"
        />
      </div>
      <StaggerGroup as="ul" className="divide-y divide-border/70 overflow-hidden rounded-2xl elevation-surface">
        {services.map((service) => (
          <StaggerItem as="li" key={service.name} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-2 text-sm",
                service.status === "operational" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <NodeDot lit={service.status === "operational"} />
              {statusLabel[service.status]}
            </span>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  )
}
