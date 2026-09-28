import { createMetadata } from "@/lib/metadata"
import { culture, roles } from "@/content/company"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBanner } from "@/components/marketing/cta-banner"
import { FeatureSection } from "@/components/marketing/feature-section"
import { PageHeader } from "@/components/marketing/page-header"
import { RolesList } from "@/components/marketing/roles-list"
import { SectionHeader } from "@/components/marketing/section-header"

export const metadata = createMetadata({
  title: "Careers",
  description: "Join Deplogram and help build the developer platform for African developers — and everyone else.",
  path: "/careers",
})

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Build the platform developers ship on."
        description="We're a small team working on infrastructure, APIs and developer experience. If you like owning systems end to end, you'll fit right in."
      />
      <FeatureSection
        eyebrow="Culture"
        title="How we work"
        description="Small team, high trust, lots of surface area."
        items={culture}
        columns={3}
      />
      <SectionWrapper id="roles">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeader eyebrow="Open roles" title="Current openings" />
          <RolesList roles={roles} />
        </Container>
      </SectionWrapper>
      <CtaBanner
        title="Not sure where you fit?"
        description="Tell us what you'd like to work on. We read every message."
        primary={{ label: "Get in touch", href: "/contact?topic=careers" }}
        secondary={{ label: "About Deplogram", href: "/about" }}
      />
    </>
  )
}
