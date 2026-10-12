import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { storageActions, storageFeatures } from "@/content/workspace"
import type { FeatureItem } from "@/content/types"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { FeatureStack } from "@/components/marketing/feature-stack"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"
import { StorageMock } from "@/components/marketing/storage-mock"

export const metadata = createMetadata({
  title: "Storage",
  description: "Simple, developer-oriented file and object storage beside your Deplogram projects: usage, folders, upload, search, sort and delete.",
  path: "/storage",
})

const actionDescriptions: Record<string, string> = {
  Upload: "Drop files in, or pick them from your machine.",
  "New folder": "Organise by project, environment or anything else.",
  Search: "Find a file by name without scrolling.",
  Sort: "By name, size or last modified.",
  Delete: "With a clear confirmation, every time.",
}

const mechanics: readonly FeatureItem[] = [
  { title: "Usage", description: "How much you've stored, at a glance.", icon: "gauge" },
  ...storageActions.map((action) => ({ title: action.label, description: actionDescriptions[action.label] ?? "", icon: action.icon })),
]

export default function StoragePage() {
  return (
    <>
      <PageHeader
        eyebrow="Storage"
        title={homeCopy.storage.title}
        description="Simple file and object storage beside your projects. The tagline carries the personality; the mechanics stay exactly as you'd expect."
      >
        <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }), "group")}>
          Join the waitlist
          <Icon name="arrow-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
        </Link>
      </PageHeader>

      <SectionWrapper spacing="compact">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <FadeInUp distance={28} className="min-w-0">
            <StorageMock />
          </FadeInUp>
          <FeatureStack items={storageFeatures} />
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container>
          <SectionHeader eyebrow="Mechanics" title="Everything where you'd *expect it.*" description="Six controls. No new vocabulary to learn." />
          <FeatureGrid items={mechanics} columns={3} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}
