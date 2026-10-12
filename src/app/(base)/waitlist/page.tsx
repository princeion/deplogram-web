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

export const metadata = createMetadata({
  title: "Join the waitlist",
  description: "Deplogram opens in waves. Join the waitlist and we'll email you when your early-access invite is ready.",
  path: "/waitlist",
})

const steps = [
  { title: "You join", description: "Leave your email. The rest is optional, but it helps." },
  { title: "We open in waves", description: "Each group starts on a stable platform before the next is invited." },
  { title: "Your invite lands", description: "One email with access to your workspace." },
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
        <Container className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <FadeInUp>
            <WaitlistForm />
          </FadeInUp>
          <StaggerGroup as="ul" className="flex flex-col gap-4">
            {waitlistPerks.map((perk, i) => (
              <StaggerItem as="li" key={perk.title} className="flex gap-4 rounded-2xl elevation-surface p-5">
                <span className="font-mono text-xs text-brand-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="grid gap-1">
                  <span className="font-medium">{perk.title}</span>
                  <span className="text-sm text-muted-foreground">{perk.description}</span>
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="compact">
        <Container>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-2xl elevation-surface p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand font-mono text-xs text-brand-foreground">{i + 1}</span>
                <span className="font-heading text-subheading font-semibold">{step.title}</span>
                <span className="text-sm text-pretty text-muted-foreground">{step.description}</span>
              </li>
            ))}
          </ol>
        </Container>
      </SectionWrapper>

      <Faq title="Before you join." items={waitlistFaq} />
    </>
  )
}
