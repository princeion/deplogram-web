import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"
import { apis } from "@/content/apis"
import { deployLog } from "@/content/deploy-flow"
import { deploymentExtras, deploymentFeatures } from "@/content/features"
import { homeCopy } from "@/content/home"
import { domainPreview, domainsPanel, pillars, storagePanel, storagePreview, workflow } from "@/content/platform"
import { runtimes } from "@/content/runtimes"
import { productStats } from "@/content/stats"
import { tools } from "@/content/tools"
import { NodeDivider } from "@/components/shared/node-divider"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ApiShowcase } from "@/components/marketing/api-showcase"
import { CtaBanner } from "@/components/marketing/cta-banner"
import { DeployDemo } from "@/components/marketing/deploy-demo"
import { DomainPreview } from "@/components/marketing/domain-preview"
import { FeatureSection } from "@/components/marketing/feature-section"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { JsonLd } from "@/components/marketing/json-ld"
import { LinkCardGrid } from "@/components/marketing/link-card-grid"
import { ProductPanels } from "@/components/marketing/product-panels"
import { RuntimesStrip } from "@/components/marketing/runtimes-strip"
import { SectionHeader } from "@/components/marketing/section-header"
import { StatsRow } from "@/components/marketing/stats-row"
import { StoragePreview } from "@/components/marketing/storage-preview"
import { ToolsShowcase } from "@/components/marketing/tools-showcase"

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.positioning}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero {...homeCopy.hero} footer={<RuntimesStrip {...homeCopy.runtimes} runtimes={runtimes} />} />
      <StatsRow stats={productStats} />
      <SectionWrapper id="platform">
        <Container>
          <SectionHeader {...homeCopy.platform} />
          <LinkCardGrid items={pillars} columns={5} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>
      <HowItWorks {...homeCopy.workflow} steps={workflow} />
      <ApiShowcase {...homeCopy.apis} apis={apis} />
      <Container>
        <NodeDivider />
      </Container>
      <ToolsShowcase {...homeCopy.tools} tools={tools} />
      <DeployDemo {...homeCopy.demo} log={deployLog} />
      <FeatureSection {...homeCopy.deploy} items={deploymentFeatures} display="matrix" extras={deploymentExtras} />
      <ProductPanels
        panels={[
          { ...storagePanel, visual: <StoragePreview files={storagePreview} /> },
          { ...domainsPanel, visual: <DomainPreview {...domainPreview} /> },
        ]}
      />
      <CtaBanner
        {...homeCopy.cta}
        primary={{ label: "Start for free", href: siteConfig.appUrl }}
        secondary={{ label: "Compare plans", href: "/pricing" }}
      />
    </>
  )
}
