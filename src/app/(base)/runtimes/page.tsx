import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { runtimeConfigFields, runtimes } from "@/content/runtimes"
import { BadgePill } from "@/components/shared/badge-pill"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { SpotlightCard } from "@/components/shared/motion/spotlight-card"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"
import { SpecRows } from "@/components/marketing/spec-rows"

export const metadata = createMetadata({
  title: "Runtimes",
  description:
    "Vite, Next.js, Node.js, Python, PHP, Go, Static Sites and Docker — how each of Deplogram's eight runtimes builds and runs.",
  path: "/runtimes",
})

export default function RuntimesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Runtimes"
        title="Your stack, your *choice.*"
        description="Eight runtimes, and a promise: we'll make these eight dependable before adding a ninth. If it runs in a container, Docker has you covered."
      >
        <ul className="flex flex-wrap gap-2">
          {runtimes.map((runtime) => (
            <li key={runtime.id}>
              <a href={`#${runtime.id}`} className="inline-flex">
                <BadgePill size="md" className="gap-2 text-foreground transition-colors hover:text-brand-ink">
                  <Icon name={runtime.icon} className="text-brand-ink" />
                  {runtime.name}
                </BadgePill>
              </a>
            </li>
          ))}
        </ul>
      </PageHeader>

      <SectionWrapper spacing="compact">
        <Container>
          <StaggerGroup as="ul" className="grid gap-4 md:grid-cols-2">
            {runtimes.map((runtime) => (
              <StaggerItem as="li" key={runtime.id} className="scroll-mt-28" >
                <HoverScale className="h-full" scale={1.01}>
                  <SpotlightCard className="h-full">
                    <article id={runtime.id} className="flex h-full scroll-mt-28 flex-col gap-6 p-6">
                      <div className="flex items-center gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg elevation-control text-brand-ink">
                          <Icon name={runtime.icon} size="lg" />
                        </span>
                        <div>
                          <h2 className="font-heading text-subheading font-semibold">{runtime.name}</h2>
                          <p className="text-sm text-muted-foreground">{runtime.detail}</p>
                        </div>
                      </div>
                      <dl className="grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-2">
                        <Phase label="Build" text={runtime.build} code={runtime.buildCommand} />
                        <Phase
                          label="Run"
                          text={runtime.run}
                          code={`${runtime.startCommand}${runtime.port !== "—" ? ` · port ${runtime.port}` : ""}`}
                        />
                      </dl>
                    </article>
                  </SpotlightCard>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeader
            eyebrow="Configure"
            title="Five settings. *Every* runtime."
            description="Runtime configuration exposes only what developers need. Exact supported versions are published at launch."
          />
          <SpecRows rows={runtimeConfigFields} />
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}

function Phase({ label, text, code }: { label: string; text: string; code: string }) {
  return (
    <div className="grid content-start gap-2">
      <dt className="font-mono text-xs tracking-eyebrow text-brand-ink uppercase">{label}</dt>
      <dd className="grid gap-3">
        <span className="text-sm text-pretty">{text}</span>
        <code className="w-fit rounded-md elevation-control px-2 py-1 font-mono text-xs text-muted-foreground">{code}</code>
      </dd>
    </div>
  )
}
