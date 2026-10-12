import Link from "next/link"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { createMetadata } from "@/lib/metadata"
import { homeCopy } from "@/content/home"
import { codepadActions, codepadFeatures } from "@/content/workspace"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CodePadMock } from "@/components/marketing/codepad-mock"
import { CtaBand } from "@/components/marketing/cta-band"
import { FeatureStack } from "@/components/marketing/feature-stack"
import { PageHeader } from "@/components/marketing/page-header"
import { SectionHeader } from "@/components/marketing/section-header"

export const metadata = createMetadata({
  title: "CodePad",
  description: "CodePad is Deplogram's in-browser editor: a familiar, serious coding environment where you can run, save, preview and deploy.",
  path: "/codepad",
})

const actionDescriptions: Record<string, string> = {
  Run: "Execute your code and read the output right below it.",
  Save: "Keep your changes with the project. Nothing lost on refresh.",
  Preview: "See a web project render as you work, where it applies.",
  Deploy: "Send it through the same deploy flow as any repository.",
}

export default function CodePadPage() {
  return (
    <>
      <PageHeader
        eyebrow="CodePad"
        title={homeCopy.codepad.title}
        description="A familiar, serious editor that lives next to your projects. Built on an open-source editor foundation, so it works the way you expect."
      >
        <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }), "group")}>
          Join the waitlist
          <Icon name="arrow-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
        </Link>
      </PageHeader>

      <SectionWrapper spacing="compact">
        <Container>
          <FadeInUp distance={28}>
            <CodePadMock />
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container>
          <SectionHeader eyebrow="The toolbar" title="Run. Save. Preview. *Deploy.*" description="Four primary actions. Everything else stays out of your way." />
          <StaggerGroup as="ul" className="hairline-grid mt-12 grid-cols-1 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
            {codepadActions.map((action) => (
              <StaggerItem as="li" key={action.label} className="hairline-cell flex flex-col gap-6 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      action.label === "Deploy" ? "bg-brand text-brand-foreground" : "elevation-control text-brand-ink"
                    )}
                  >
                    <Icon name={action.icon} size="md" />
                  </span>
                  <kbd className="rounded-md elevation-control px-2 py-1 font-mono text-xs text-muted-foreground">{action.shortcut}</kbd>
                </div>
                <div className="grid gap-1.5">
                  <h3 className="font-heading text-subheading font-semibold">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{actionDescriptions[action.label]}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </SectionWrapper>

      <SectionWrapper>
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeader
            eyebrow="Built for real work"
            title="A familiar editor, *ready to work.*"
            description="Conventional controls, clear output and readable errors — the editor stays out of your way."
          />
          <FeatureStack items={codepadFeatures} />
        </Container>
      </SectionWrapper>

      <CtaBand {...homeCopy.cta} />
    </>
  )
}
