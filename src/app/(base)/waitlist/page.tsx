import { createMetadata } from "@/lib/metadata"
import { faq } from "@/content/faq"
import { waitlistPerks } from "@/content/waitlist"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { Faq } from "@/components/marketing/faq"
import { PageHeader } from "@/components/marketing/page-header"
import { WaitlistForm } from "@/components/marketing/waitlist-form"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { ProductStage } from "@/components/marketing/product-cards"
import { SectionHeader } from "@/components/marketing/section-header"
import type { FeatureItem } from "@/content/types"

export const metadata = createMetadata({
  title: "Join the waitlist",
  description: "Deplogram opens in waves. Join the waitlist and we'll email you when your early-access invite is ready.",
  path: "/waitlist",
})

const steps: readonly FeatureItem[] = [
  { title: "You join", description: "Leave your email. The rest is optional, but it helps.", icon: "mail" },
  { title: "We open in waves", description: "Each group starts on a stable platform before the next is invited.", icon: "layers" },
  { title: "Your invite lands", description: "One email with access to your workspace.", icon: "rocket" },
]

const waitlistFaq = faq.filter((item) => /today|deploy\?|web host/.test(item.question))

export default function WaitlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Early access"
        title="Join the *waitlist.*"
        description="Deplogram is opening in waves. Join the waitlist and we'll email you when your early-access invite is ready."
      />

      <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
        <Container>
          <FadeInUp distance={28}>
            <ProductStage variant="b" source="flow" className="lg:py-16">
              <div className="mx-auto grid max-w-5xl items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
                <WaitlistForm />
                <StaggerGroup as="ul" className="flex flex-col gap-3">
                  {waitlistPerks.map((perk, i) => (
                    <StaggerItem as="li" key={perk.title} className="glass flex gap-4 rounded-2xl p-5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-mono text-xs text-neutral-950">{i + 1}</span>
                      <span className="grid gap-1">
                        <span className="font-medium">{perk.title}</span>
                        <span className="text-sm text-white/65">{perk.description}</span>
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="compact">
        <Container>
          <SectionHeader eyebrow="How it works" title="From waitlist to *workspace.*" align="center" />
          <FeatureGrid items={steps} columns={3} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>

      <Faq title="Before you join." items={waitlistFaq} />
    </>
  )
}
