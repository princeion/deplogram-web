import { createMetadata } from "@/lib/metadata"
import { siteConfig } from "@/lib/site"
import { pricingFaq } from "@/content/faq"
import { billingModel, comparison, meteredServices, plans } from "@/content/pricing"
import { Container } from "@/components/shared/container"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBanner } from "@/components/marketing/cta-banner"
import { Faq } from "@/components/marketing/faq"
import { FeatureSection } from "@/components/marketing/feature-section"
import { PageHeader } from "@/components/marketing/page-header"
import { PricingCard } from "@/components/marketing/pricing-card"
import { PricingComparison } from "@/components/marketing/pricing-comparison"
import { SectionHeader } from "@/components/marketing/section-header"

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Start free with the core APIs, every developer utility, test deployments and storage. Plus and Pro add higher limits and persistent deployments; usage beyond your quota is pay as you go.",
  path: "/pricing",
})

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Free to start. Pay as you grow."
        description="Most APIs and every utility are free to use. Subscriptions add higher limits, more storage and persistent deployments — and usage beyond your quota is billed only when you use it."
      />
      <SectionWrapper spacing="compact">
        <Container>
          <StaggerGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <StaggerItem as="li" key={plan.id}>
                <HoverScale className="h-full" scale={1.01}>
                  <PricingCard plan={plan} />
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <p className="mt-6 text-center text-sm text-muted-foreground">Prices in naira (₦), billed monthly.</p>
        </Container>
      </SectionWrapper>
      <FeatureSection
        eyebrow="How billing works"
        title="Subscriptions for headroom. Usage for everything else."
        description="Free access to start, predictable plans for more capacity, and pay-as-you-go beyond what your plan includes."
        items={billingModel}
        extras={meteredServices}
        extrasLabel="Billed by usage"
      />
      <SectionWrapper>
        <Container>
          <SectionHeader eyebrow="Compare plans" title="What's in each plan" />
          <div className="mt-12">
            <PricingComparison plans={plans} groups={comparison} />
          </div>
        </Container>
      </SectionWrapper>
      <Faq title="Questions about pricing" items={pricingFaq} />
      <CtaBanner
        title="Start with Freebies today."
        description="Core APIs, every utility, test deployments on myapp.dpl.app and a small storage allowance — free."
        primary={{ label: "Start for free", href: siteConfig.appUrl }}
        secondary={{ label: "Talk to sales", href: "/contact?topic=enterprise" }}
      />
    </>
  )
}
