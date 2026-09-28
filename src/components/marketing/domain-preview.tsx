import { cn } from "@/lib/utils"
import type { domainPreview } from "@/content/platform"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { NodeDot } from "@/components/shared/node-graph"

type DomainStatus = (typeof domainPreview)["results"][number]["status"]

const statusLabel: Record<DomainStatus, string> = {
  connected: "Connected",
  available: "Available",
  taken: "Taken",
}

/** Illustrative domain search for the Domains panel: the free dpl.app address plus search results. */
export function DomainPreview({ query, results }: typeof domainPreview) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-background/60 p-4 sm:p-5">
      <div aria-hidden className="absolute inset-0 bg-dot-grid mask-fade-edges" />
      <div className="relative flex h-10 items-center gap-2 rounded-full elevation-control px-4 text-sm">
        <Icon name="search" className="text-muted-foreground" />
        <span className="font-mono text-foreground">{query}</span>
        <span
          aria-hidden
          className="-ml-1.5 inline-block h-4 w-px animate-blink bg-brand-ink motion-reduce:animate-none"
        />
      </div>
      <StaggerGroup as="ul" className="relative mt-4 flex flex-col gap-2">
        {results.map((result) => (
          <StaggerItem
            as="li"
            key={result.domain}
            className="flex items-center gap-3 rounded-lg elevation-control px-3 py-2.5 text-xs"
          >
            <Icon name="globe" className={result.status === "taken" ? "text-muted-foreground" : "text-brand-ink"} />
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-mono",
                result.status === "taken" ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {result.domain}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-2",
                result.status === "taken" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {result.status === "connected" && <NodeDot lit />}
              {statusLabel[result.status]}
            </span>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  )
}
