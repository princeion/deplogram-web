import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { GradientBackground } from "@/components/shared/gradient-background"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { Magnetic } from "@/components/shared/motion/magnetic"
import { NodeGraph } from "@/components/shared/node-graph"
import { SectionWrapper } from "@/components/shared/section-wrapper"

type CtaLink = { label: string; href: string }

type CtaBannerProps = {
  title: string
  description: string
  primary: CtaLink
  secondary?: CtaLink
}

/** Closing call to action. Shared by every page that ends in a CTA. */
export function CtaBanner({ title, description, primary, secondary }: CtaBannerProps) {
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
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Magnetic>
                    <Link href={primary.href} className={cn(buttonVariants({ size: "lg" }), "group")}>
                      {primary.label}
                      <Icon
                        name="arrow-right"
                        className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
                      />
                    </Link>
                  </Magnetic>
                  {secondary && (
                    <Link href={secondary.href} className={buttonVariants({ variant: "outline", size: "lg" })}>
                      {secondary.label}
                    </Link>
                  )}
                </div>
              </div>
              <NodeGraph layout="status" state="live" animated className="hidden w-full max-w-sm justify-self-end lg:block" />
            </div>
          </div>
        </FadeInUp>
      </Container>
    </SectionWrapper>
  )
}
