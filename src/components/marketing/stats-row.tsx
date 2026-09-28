import { cn } from "@/lib/utils"
import type { Stat } from "@/content/stats"
import { Container } from "@/components/shared/container"
import { AnimatedCounter } from "@/components/shared/motion/animated-counter"

/** Bordered row of counters (product facts only). */
export function StatsRow({ stats }: { stats: readonly Stat[] }) {
  return (
    <div className="border-y border-border/70">
      <Container>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center gap-1 border-border/70 px-4 py-8 text-center sm:py-10",
                i % 2 === 1 ? "border-l" : "",
                i >= 2 ? "border-t lg:border-t-0" : "",
                i === 2 ? "lg:border-l" : "",
              )}
            >
              <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 font-heading text-heading font-semibold">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  )
}
