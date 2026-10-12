import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** Name | description rows on a Surface — a spec sheet (config fields, limit dimensions). */
export function SpecRows({ rows }: { rows: readonly { name: string; description: string }[] }) {
  return (
    <StaggerGroup as="ul" className="overflow-hidden rounded-3xl elevation-surface">
      {rows.map((row, i) => (
        <StaggerItem
          as="li"
          key={row.name}
          className="grid gap-1 border-b border-border/70 px-6 py-5 last:border-b-0 sm:grid-cols-[16rem_1fr] sm:gap-8 sm:px-8"
        >
          <p className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-medium">{row.name}</span>
          </p>
          <p className="text-pretty text-muted-foreground">{row.description}</p>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
