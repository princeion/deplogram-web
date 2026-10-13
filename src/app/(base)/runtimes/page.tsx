import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { runtimeConfigFields, runtimes } from "@/content/runtimes"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { GradientStage, gradientFor } from "@/components/marketing/gradient-stage"
import { RuntimesIllustration } from "@/components/marketing/product-illustrations"
import { SimpleHero } from "@/components/marketing/simple-hero"
import { ProductStage } from "@/components/marketing/product-cards"
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
      <SimpleHero title="Your stack, your choice." primary={{ label: "Join the waitlist", href: "/waitlist" }} secondary={{ label: "How deployment works", href: "/deploy" }} />

      <SectionWrapper spacing="compact" className="pt-0">
        <Container>
          <FadeInUp distance={28}>
            <ProductStage variant="c">
              <RuntimesIllustration className="max-w-md" />
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="compact">
        <Container>
          <SectionHeader eyebrow="Eight runtimes" title="How each one *builds and runs.*" align="center" />
          <StaggerGroup as="ul" className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
            {runtimes.map((runtime, i) => (
              <StaggerItem as="li" key={runtime.id} className="scroll-mt-28">
                <article id={runtime.id} className="group flex h-full scroll-mt-28 flex-col rounded-2xl bg-card p-2.5 ring-1 ring-border/60">
                  <GradientStage {...gradientFor(i)} className="flex aspect-[4/3] flex-col items-center justify-center gap-5 rounded-xl">
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-xl shadow-black/15 transition-transform duration-500 ease-out-expo group-hover:scale-105">
                      <Icon name={runtime.icon} size="lg" className="size-7" />
                    </span>
                    <span className="glass rounded-full px-3 py-1 font-mono text-[0.6875rem]">{runtime.buildCommand}</span>
                  </GradientStage>
                  <div className="flex flex-1 flex-col gap-4 px-3 pt-5 pb-3">
                    <div className="grid gap-1">
                      <h2 className="font-heading text-subheading font-medium">{runtime.name}</h2>
                      <p className="text-sm text-pretty text-muted-foreground">{runtime.detail}</p>
                    </div>
                    <dl className="mt-auto grid gap-3 border-t border-border/70 pt-4 text-xs">
                      <Phase label="Build" text={runtime.build} />
                      <Phase label="Run" text={runtime.run} code={`${runtime.startCommand}${runtime.port !== "—" ? ` · :${runtime.port}` : ""}`} />
                    </dl>
                  </div>
                </article>
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

function Phase({ label, text, code }: { label: string; text: string; code?: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-medium">{label}</dt>
      <dd className="grid gap-2 text-pretty text-muted-foreground">
        {text}
        {code && <code className="w-fit rounded-md border border-border/70 bg-background px-2 py-0.5 font-mono text-[0.6875rem] text-foreground/80">{code}</code>}
      </dd>
    </div>
  )
}
