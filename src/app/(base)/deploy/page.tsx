import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { createMetadata } from "@/lib/metadata"
import { backendResponsibilities } from "@/content/deploy"
import { homeCopy } from "@/content/home"
import { runtimeConfigFields } from "@/content/runtimes"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { DeployFlow } from "@/components/marketing/deploy-flow"
import { LifecycleBand } from "@/components/marketing/lifecycle-band"
import { PageHeader } from "@/components/marketing/page-header"
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
      <PageHeader
        eyebrow="Deploy"
        title="Serve and test your work *seamlessly.*"
        description="Deployment is the centre of Deplogram. Connect a repository, pick one of eight runtimes, set only what matters, and watch it go live."
      >
        <div className="flex flex-wrap gap-3">
          <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }), "group")}>
            Join the waitlist
            <Icon name="arrow-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
          </Link>
          <Link href="/runtimes" className={buttonVariants({ variant: "outline", size: "lg" })}>
            See the runtimes
          </Link>
        </div>
      </PageHeader>

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
