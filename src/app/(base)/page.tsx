import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"
import { principles } from "@/content/about"
import { faq } from "@/content/faq"
import { homeCopy } from "@/content/home"
import { roadmap } from "@/content/roadmap"
import { runtimes } from "@/content/runtimes"
import { apis } from "@/content/tools"
import { codepadFeatures, storageFeatures } from "@/content/workspace"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { NodeDivider } from "@/components/shared/node-divider"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ApiExplorer } from "@/components/marketing/api-explorer"
import { CodePadMock } from "@/components/marketing/codepad-mock"
import { CtaBand } from "@/components/marketing/cta-band"
import { DeployConsole } from "@/components/marketing/deploy-console"
import { DeployFlow } from "@/components/marketing/deploy-flow"
import { Faq } from "@/components/marketing/faq"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { FeatureStack, SectionLink } from "@/components/marketing/feature-stack"
import { GalleyMock } from "@/components/marketing/galley-mock"
import { Hero } from "@/components/marketing/hero"
import { JsonLd } from "@/components/marketing/json-ld"
import { LifecycleBand } from "@/components/marketing/lifecycle-band"
import { LinkCardGrid } from "@/components/marketing/link-card-grid"
import { RoadmapList } from "@/components/marketing/roadmap-list"
import { RuntimesStrip } from "@/components/marketing/runtimes-strip"
import { SectionHeader } from "@/components/marketing/section-header"
import { StorageMock } from "@/components/marketing/storage-mock"
import { UtilitiesGrid } from "@/components/marketing/utilities-grid"

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.positioning}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
}

/** The product family, as link cards. */
const pillars = [
  { title: "Deploy", description: "GitHub repo → runtime → live URL, with progress and logs.", icon: "rocket", href: "/deploy" },
  { title: "Runtimes", description: "Eight runtimes, made dependable before we add a ninth.", icon: "layers", href: "/runtimes" },
  { title: "CodePad", description: "A familiar editor in your Galley. Run, save, preview, deploy.", icon: "code", href: "/codepad" },
  { title: "Storage", description: "Files and folders beside your projects. Simple, as it should be.", icon: "database", href: "/storage" },
  { title: "Utilities & APIs", description: "Six developer utilities and four APIs.", icon: "wrench", href: "/tools" },
] as const

export default function HomePage() {
  const c = homeCopy
  return (
    <>
      <JsonLd />
      <Hero {...c.hero} footer={<RuntimesStrip {...c.runtimes} runtimes={runtimes} />} />

      <SectionWrapper id="console" spacing="compact">
        <Container>
          <SectionHeader {...c.console} align="center" className="mx-auto" />
          <FadeInUp delay={0.1} distance={28} className="mx-auto mt-12 max-w-5xl sm:mt-16">
            <DeployConsole />
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="platform">
        <Container>
          <SectionHeader {...c.platform} />
          <LinkCardGrid items={pillars} columns={5} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>

      <SectionWrapper id="deploy">
        <Container>
          <SectionHeader {...c.deploy} />
          <div className="mt-12 sm:mt-16">
            <DeployFlow />
          </div>
          <SectionLink href="/deploy">How deployment works</SectionLink>
        </Container>
      </SectionWrapper>

      <LifecycleBand {...c.lifecycle} showBuildVsRun={false} />

      <Container>
        <NodeDivider />
      </Container>

      <SectionWrapper id="galley">
        <Container>
          <SectionHeader {...c.galley} />
          <FadeInUp distance={28} className="mt-12 sm:mt-16">
            <GalleyMock />
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="codepad">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <SectionHeader {...c.codepad} />
            <FeatureStack items={codepadFeatures} className="mt-10" />
            <SectionLink href="/codepad">Inside CodePad</SectionLink>
          </div>
          <FadeInUp distance={28} className="min-w-0">
            <CodePadMock />
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="storage">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <FadeInUp distance={28} className="order-2 min-w-0 lg:order-1">
            <StorageMock />
          </FadeInUp>
          <div className="order-1 lg:order-2">
            <SectionHeader {...c.storage} />
            <FeatureStack items={storageFeatures} className="mt-10" />
            <SectionLink href="/storage">More on storage</SectionLink>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="tools">
        <Container>
          <SectionHeader {...c.tools} />
          <div className="mt-12 grid gap-4 sm:mt-16">
            <UtilitiesGrid />
            <ApiExplorer apis={apis} />
          </div>
          <SectionLink href="/tools">All utilities & APIs</SectionLink>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="principles">
        <Container>
          <SectionHeader {...c.principles} />
          <FeatureGrid items={principles} columns={3} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>

      <SectionWrapper id="roadmap">
        <Container>
          <SectionHeader {...c.roadmap} />
          <div className="mt-12 sm:mt-16">
            <RoadmapList phases={roadmap} />
          </div>
          <SectionLink href="/roadmap">The full roadmap</SectionLink>
        </Container>
      </SectionWrapper>

      <Faq {...c.faq} items={faq} />

      <CtaBand {...c.cta} />
    </>
  )
}
