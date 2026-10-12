import type * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { Icon } from "@/components/shared/icon";
import { FadeInUp } from "@/components/shared/motion/fade-in-up";
import { Magnetic } from "@/components/shared/motion/magnetic";
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger";
import { TextReveal } from "@/components/shared/motion/text-reveal";
import { NodeDot } from "@/components/shared/node-graph";
import { HeroMark } from "@/components/marketing/hero-mark";

type HeroProps = {
  announcement: { label: string; cta: string; href: string };
  /** "\n" forces the line break; `*word*` renders in the brand ink. */
  headline: string;
  description: string;
  /** Short statements in the right-hand column. */
  points: readonly string[];
  /** Pinned to the bottom of the first screen (the runtimes row). */
  footer?: React.ReactNode;
};

/**
 * Full-viewport hero on a three-column stage: headline + CTAs left, the logo mark centre-stage,
 * short statements right, and a row pinned to the bottom of the first screen.
 */
export function Hero({ announcement, headline, description, points, footer }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50 mask-fade-edges" />
      <Container className="relative flex flex-col pt-24 pb-12 sm:pt-28 lg:min-h-svh">
        <FadeInUp className="flex justify-center">
          <Link
            href={announcement.href}
            className="group inline-flex items-center gap-3 rounded-full px-4 py-1.5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <NodeDot lit />
            <span className="hidden sm:inline">{announcement.label}</span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              {announcement.cta}
              <Icon
                name="chevron-right"
                size="xs"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </FadeInUp>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-10 lg:py-10">
          <div className="flex flex-col items-start">
            <TextReveal as="h1" text={headline} delay={0.1} immediate className="font-heading text-display font-semibold" />
            <FadeInUp delay={0.4}>
              <p className="mt-6 max-w-md text-lead text-pretty text-muted-foreground">{description}</p>
            </FadeInUp>
            <FadeInUp delay={0.5} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link href={siteConfig.waitlistUrl} className={cn(buttonVariants({ size: "lg" }), "group")}>
                  Join the waitlist
                  <Icon
                    name="arrow-right"
                    className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
                  />
                </Link>
              </Magnetic>
              <Link href="/deploy" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See how it deploys
              </Link>
            </FadeInUp>
          </div>

          <FadeInUp delay={0.2} distance={0} className="justify-self-center">
            <HeroMark className="w-52 sm:w-64 lg:w-52 xl:w-72" />
          </FadeInUp>

          <StaggerGroup as="ul" className="flex flex-col gap-3 lg:justify-self-end">
            {points.map((point) => (
              <StaggerItem as="li" key={point} className="text-lg font-medium text-foreground">
                {point}
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>

        {footer && <FadeInUp delay={0.7}>{footer}</FadeInUp>}
      </Container>
    </section>
  );
}
