import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { notYet, roadmap, roadmapStatusLabel, type RoadmapStatus } from "@/content/roadmap"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { PageHeader } from "@/components/marketing/page-header"
import { RoadmapList, RoadmapStatusChip } from "@/components/marketing/roadmap-list"
import { SectionHeader } from "@/components/marketing/section-header"

export const metadata = createMetadata({
  title: "Roadmap",
  description: "Where Deplogram is right now: what's done, what's being built, and what comes with early access and launch.",
  path: "/roadmap",
})

const legend = Object.keys(roadmapStatusLabel) as RoadmapStatus[]

export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Roadmap"
        title={homeCopy.roadmap.title}
        description="Deplogram is an MVP in progress. This is where it stands — honestly, and without dates we haven't committed to."
      >
        <ul className="flex flex-wrap gap-2">
          {legend.map((status) => (
            <li key={status}>
              <RoadmapStatusChip status={status} />
            </li>
          ))}
        </ul>
      </PageHeader>

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
