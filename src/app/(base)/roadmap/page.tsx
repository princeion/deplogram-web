import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { notYet, roadmap } from "@/content/roadmap"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { SimpleHero } from "@/components/marketing/simple-hero"
import { ProductStage } from "@/components/marketing/product-cards"
import { RoadmapIllustration } from "@/components/marketing/product-illustrations"
import { RoadmapList } from "@/components/marketing/roadmap-list"
import { SectionHeader } from "@/components/marketing/section-header"

export const metadata = createMetadata({
  title: "Product roadmap",
  description: "Where Deplogram is right now: what's done, what's being built, and what comes with early access and launch.",
  path: "/roadmap",
})


export default function RoadmapPage() {
  return (
    <>
      <SimpleHero title={homeCopy.roadmap.title} primary={{ label: "Join the waitlist", href: "/waitlist" }} secondary={{ label: "Contact us", href: "/contact" }} />

      <SectionWrapper spacing="compact" className="pt-0">
        <Container>
          <FadeInUp distance={28}>
            <ProductStage variant="a" source="flow">
              <RoadmapIllustration />
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="compact">
        <Container>
          <RoadmapList phases={roadmap} detailed />
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeader eyebrow="Not in the first release" title="Said plainly, so nobody waits for them." />
          <FadeInUp>
            <ul className="overflow-hidden rounded-3xl elevation-surface">
              {notYet.map((item) => (
                <li key={item} className="flex items-center gap-4 border-b border-border/70 px-6 py-5 last:border-b-0">
                  <Icon name="minus" className="text-muted-foreground" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}
