
import { createMetadata } from "@/lib/metadata"
import { backendResponsibilities } from "@/content/deploy"
import { homeCopy } from "@/content/home"
import { runtimeConfigFields } from "@/content/runtimes"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { DeployConsole } from "@/components/marketing/deploy-console"
import { DeployFlow } from "@/components/marketing/deploy-flow"
import { LifecycleBand } from "@/components/marketing/lifecycle-band"
import { SimpleHero } from "@/components/marketing/simple-hero"
import { ProductStage } from "@/components/marketing/product-cards"
import { PrinciplesGrid } from "@/components/marketing/principles-grid"
import { SectionHeader } from "@/components/marketing/section-header"
import { SpecRows } from "@/components/marketing/spec-rows"

export const metadata = createMetadata({
  title: "Deploy",
  description:
    "Source, runtime, configure, deploy, live. Deplogram's deploy flow takes a GitHub repository to a running deployment across eight runtimes.",
  path: "/deploy",
})

export default function DeployPage() {
  return (
    <>
      <SimpleHero title="Serve and test your work seamlessly." primary={{ label: "Join the waitlist", href: "/waitlist" }} secondary={{ label: "See the runtimes", href: "/runtimes" }} />

      <SectionWrapper spacing="compact" className="pt-0">
        <Container>
          <FadeInUp distance={28}>
            <ProductStage variant="b">
              <DeployConsole className="mx-auto max-w-5xl" />
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="compact">
        <Container>
          <DeployFlow />
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeader
            eyebrow="Configure"
            title="Only the settings that *matter.*"
            description="Each runtime exposes the same five settings, with sensible defaults you can override."
          />
          <SpecRows rows={runtimeConfigFields} />
        </Container>
      </SectionWrapper>

      <LifecycleBand {...homeCopy.lifecycle} />

      <SectionWrapper>
        <Container>
          <SectionHeader
            eyebrow="Underneath"
            title="Complexity stays *underneath.*"
            description="The deploy screen stays simple because the platform does the heavy lifting. Here's what it's responsible for."
          />
          <div className="mt-12 sm:mt-16">
            <PrinciplesGrid items={backendResponsibilities} />
          </div>
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}
