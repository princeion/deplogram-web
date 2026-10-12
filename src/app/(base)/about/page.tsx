import { createMetadata } from "@/lib/metadata"
import { aboutCopy, principles } from "@/content/about"
import { homeCopy } from "@/content/home"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"
import { StoryBlock } from "@/components/marketing/story-block"

export const metadata = createMetadata({
  title: "About",
  description: "Deplogram is a lightweight developer cloud, operated by REKTINA — deployment at the core, a compact kit around it.",
  path: "/about",
})

export default function AboutPage() {
  const { hero, story, quote } = aboutCopy
  return (
    <>
      <PageHeader eyebrow="About" title={hero.title} description={hero.description} />
      <StoryBlock eyebrow="Our story" title={story.title} paragraphs={story.paragraphs} mission={quote} />
      <SectionWrapper>
        <Container>
          <SectionHeader {...homeCopy.principles} />
          <FeatureGrid items={principles} columns={3} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>
      <CtaBand {...homeCopy.cta} />
    </>
  )
}
