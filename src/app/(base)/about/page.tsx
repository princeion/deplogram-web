import { createMetadata } from "@/lib/metadata"
import { siteConfig } from "@/lib/site"
import { aboutCopy } from "@/content/about"
import { team, values } from "@/content/company"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBanner } from "@/components/marketing/cta-banner"
import { FeatureSection } from "@/components/marketing/feature-section"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"
import { StoryBlock } from "@/components/marketing/story-block"
import { TeamGrid } from "@/components/marketing/team-grid"

export const metadata = createMetadata({
  title: "About",
  description:
    "Deplogram, operated by REKTINA, is building the developer platform we wanted: APIs, utilities, storage, domains and deployments from one account.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <>
      <PageHeader {...aboutCopy.header} />
      <StoryBlock {...aboutCopy.story} />
      <FeatureSection {...aboutCopy.values} items={values} columns={4} />
      <SectionWrapper>
        <Container>
          <SectionHeader {...aboutCopy.team} />
          <div className="mt-12 sm:mt-16">
            <TeamGrid members={team} />
          </div>
        </Container>
      </SectionWrapper>
      <CtaBanner
        {...aboutCopy.cta}
        primary={{ label: "See open roles", href: "/careers" }}
        secondary={{ label: "Start for free", href: siteConfig.appUrl }}
      />
    </>
  )
}
