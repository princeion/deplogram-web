import { buildVsRun, failureStates, lifecycle } from "@/content/deploy"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { NodeTexture } from "@/components/shared/node-texture"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { StateBadge } from "@/components/marketing/product-window"
import { SectionHeader } from "@/components/marketing/section-header"

type LifecycleBandProps = {
  eyebrow: string
  title: string
  description: string
  /** Show the build-time vs run-time pair under the pipeline. */
  showBuildVsRun?: boolean
}

/** QUEUED → RUNNING as a pipeline of steps with a scanning light, the failure states under it. */
export function LifecycleBand({ eyebrow, title, description, showBuildVsRun = true }: LifecycleBandProps) {
  return (
    <SectionWrapper id="lifecycle" className="overflow-hidden">
      <NodeTexture className="-top-10 -right-40 w-160" />
      <Container className="relative">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />

        <FadeInUp className="relative mt-12 overflow-hidden rounded-3xl elevation-surface sm:mt-16">
          <StaggerGroup as="ol" className="grid grid-cols-1 sm:grid-cols-5">
            {lifecycle.map((step, i) => (
              <StaggerItem
                as="li"
                key={step.state}
                className="relative flex flex-col gap-8 border-border/70 p-6 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0"
              >
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="grid gap-2">
                  <StateBadge state={step.state} className="w-fit" />
                  <span className="text-sm text-pretty text-muted-foreground">{step.description}</span>
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>
          {/* The scanning light — a deployment moving through the states. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden">
            <div className="h-full w-1/3 animate-scan bg-linear-to-r from-transparent via-brand to-transparent motion-reduce:hidden" />
          </div>
        </FadeInUp>

        <StaggerGroup as="ul" className="mt-4 grid gap-4 sm:grid-cols-3">
          {failureStates.map((failure) => (
            <StaggerItem as="li" key={failure.state} className="flex items-start gap-4 rounded-2xl elevation-surface p-5">
              <Icon name="circle-x" className="mt-0.5 text-destructive" />
              <div className="grid gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <StateBadge state={failure.state} />
                  <span className="font-mono text-[0.625rem] text-muted-foreground">after {failure.after}</span>
                </p>
                <p className="text-sm text-muted-foreground">{failure.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {showBuildVsRun && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[buildVsRun.build, buildVsRun.run].map((side, i) => (
              <FadeInUp key={side.title} delay={i * 0.08} className="flex flex-col gap-5 rounded-3xl elevation-surface p-6 sm:p-8">
                <p className="font-mono text-xs tracking-eyebrow text-brand-ink uppercase">{side.title}</p>
                <p className="font-heading text-subheading font-medium text-balance">{side.description}</p>
                <ul className="grid gap-3 text-sm sm:grid-cols-2">
                  {side.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <Icon name="check" className="mt-0.5 text-brand-ink" />
                      {point}
                    </li>
                  ))}
                </ul>
              </FadeInUp>
            ))}
          </div>
        )}
      </Container>
    </SectionWrapper>
  )
}
