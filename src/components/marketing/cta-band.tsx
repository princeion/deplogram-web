import type { WaitlistSource } from "@/content/waitlist"
import { Container } from "@/components/shared/container"
import { GradientBackground } from "@/components/shared/gradient-background"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { NodeGraph } from "@/components/shared/node-graph"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { WaitlistInline } from "@/components/marketing/waitlist-form"

type CtaBandProps = {
  title: string
  description: string
  source?: WaitlistSource
}

/** Closing call to action on every page: the CTA banner surface with the waitlist form inside. */
export function CtaBand({ title, description, source = "cta" }: CtaBandProps) {
  return (
    <SectionWrapper>
      <Container>
        <FadeInUp>
          <div className="relative overflow-hidden rounded-3xl elevation-surface px-6 py-14 sm:px-12 sm:py-20">
            <GradientBackground />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col items-start">
                <h2 className="max-w-xl font-heading text-heading font-semibold text-balance">{title}</h2>
                <p className="mt-4 max-w-lg text-lead text-pretty text-muted-foreground">{description}</p>
                <WaitlistInline source={source} primary className="mt-8 max-w-lg" note="No spam. One email when your invite is ready." />
              </div>
              <NodeGraph layout="status" state="live" animated className="hidden w-full max-w-sm justify-self-end lg:block" />
            </div>
          </div>
        </FadeInUp>
      </Container>
    </SectionWrapper>
  )
}
