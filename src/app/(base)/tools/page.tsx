
import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { apis } from "@/content/tools"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ApiExplorer } from "@/components/marketing/api-explorer"
import { CtaBand } from "@/components/marketing/cta-band"
import { ApiIllustration } from "@/components/marketing/product-illustrations"
import { SimpleHero } from "@/components/marketing/simple-hero"
import { ProductStage } from "@/components/marketing/product-cards"
import { SectionHeader } from "@/components/marketing/section-header"
import { ToolPlayground } from "@/components/marketing/tool-playground"
import { UtilitiesGrid } from "@/components/marketing/utilities-grid"

export const metadata = createMetadata({
  title: "Developer utilities and APIs",
  description: "Six developer utilities and four APIs — OTP, email, image transform and QR codes — that sit next to your Deplogram projects.",
  path: "/tools",
})

export default function ToolsPage() {
  return (
    <>
      <SimpleHero title={homeCopy.tools.title} primary={{ label: "Join the waitlist", href: "/waitlist" }} secondary={{ label: "Try the utilities", href: "#utilities" }} />

      <SectionWrapper spacing="compact" className="pt-0">
        <Container>
          <FadeInUp distance={28}>
            <ProductStage variant="a" source="lime">
              <ApiIllustration className="max-w-md" />
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

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
