import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { apis } from "@/content/tools"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ApiExplorer } from "@/components/marketing/api-explorer"
import { CtaBand } from "@/components/marketing/cta-band"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"
import { ToolPlayground } from "@/components/marketing/tool-playground"
import { UtilitiesGrid } from "@/components/marketing/utilities-grid"

export const metadata = createMetadata({
  title: "Utilities & APIs",
  description: "Six developer utilities and four APIs — OTP, email, image transform and QR codes — that sit next to your Deplogram projects.",
  path: "/tools",
})

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Utilities & APIs"
        title={homeCopy.tools.title}
        description="A small set of supporting tools, chosen carefully. The metaphor stops here — endpoints, requests and responses stay technical."
      >
        <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }), "group")}>
          Join the waitlist
          <Icon name="arrow-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
        </Link>
      </PageHeader>

      <SectionWrapper id="utilities" spacing="compact">
        <Container>
          <SectionHeader eyebrow="6 utilities" title="For the small jobs *between commits.*" description="Browser tools, no install. Three of them work right here." />
          <div className="mt-12 grid gap-4 sm:mt-16">
            <UtilitiesGrid />
            <FadeInUp>
              <ToolPlayground />
            </FadeInUp>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper id="apis">
        <Container>
          <SectionHeader
            eyebrow="4 APIs"
            title="Four APIs, *one key.*"
            description="Create a key in your Galley and call any of them. Requests and responses below are illustrative — the reference ships with early access."
          />
          <div className="mt-12 sm:mt-16">
            <ApiExplorer apis={apis} />
          </div>
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}
