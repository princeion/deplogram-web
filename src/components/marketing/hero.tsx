import type * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { Icon } from "@/components/shared/icon";
import { FadeInUp } from "@/components/shared/motion/fade-in-up";
import { TextReveal } from "@/components/shared/motion/text-reveal";
import { GradientStage } from "@/components/marketing/gradient-stage";
import { ScreenSwitch } from "@/components/shared/screen-switch";

type HeroProps = {
  announcement: { label: string; cta: string; href: string };
  /** "\n" forces the line break; `*` markers are ignored (the hero is set in plain white). */
  headline: string;
  description: string;
  /** Short statements shown as a row under the CTAs. */
  points: readonly string[];
  /** The product, shown on a gradient stage under the copy. */
  visual?: React.ReactNode;
  /** A compact stand-in for `visual` below the md breakpoint, where a full mock is unreadable. */
  mobileVisual?: React.ReactNode;
  /** Closes the hero (the runtimes row). */
  footer?: React.ReactNode;
};

/**
 * Homepage hero, OpenAI-style: centred announcement, headline, description and CTAs, then the
 * live product on a gradient stage.
 */
export function Hero({
  announcement,
  headline,
  description,
  points,
  visual,
  mobileVisual,
  footer,
}: HeroProps) {
  return (
    <section data-hero className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem]"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 70%)",
        }}
      />
      <Container className="relative flex flex-col items-center pt-32 pb-12 text-center sm:pt-40">
        <FadeInUp>
          <Link
            href={announcement.href}
            className="group inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-card/60 py-1 pr-3 pl-1 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-border hover:text-foreground"
          >
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
              Early access
            </span>
            <span className="hidden sm:inline">{announcement.label}</span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground sm:hidden">
              {announcement.cta}
            </span>
            <Icon
              name="chevron-right"
              size="xs"
              className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
            />
          </Link>
        </FadeInUp>

        <TextReveal
          as="h1"
          text={headline.replace(/\*/g, "")}
          delay={0.1}
          immediate
          className="mt-8 max-w-6xl font-heading text-[clamp(2.5rem,1.5rem+3.2vw,4.25rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance"
        />

        <FadeInUp delay={0.35}>
          <p className="font-heading mx-auto mt-6 max-w-4xl text-lead text-pretty text-muted-foreground">
            {description}
          </p>
        </FadeInUp>

        <FadeInUp
          delay={0.45}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={siteConfig.waitlistUrl}
            className={cn(
              buttonVariants({ variant: "inverted", size: "lg" }),
              "group h-12 px-6 text-base",
            )}
          >
            Join the waitlist
            <Icon
              name="arrow-up-right"
              className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
          <Link
            href="/deploy"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-12 px-6 text-base",
            )}
          >
            See how it deploys
          </Link>
        </FadeInUp>

        <FadeInUp delay={0.55}>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {points.map((point) => (
              <li key={point} className="inline-flex items-center gap-2">
                <Icon name="check" size="xs" className="text-foreground" />
                {point}
              </li>
            ))}
          </ul>
        </FadeInUp>

        {visual && (
          <FadeInUp delay={0.6} distance={40} className="mt-16 w-full sm:mt-20">
            <GradientStage
              source="flow"
              className="px-4 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16"
            >
              <div className="mx-auto max-w-5xl text-left">
                {mobileVisual ? <ScreenSwitch desktop={visual} mobile={mobileVisual} /> : visual}
              </div>
            </GradientStage>
          </FadeInUp>
        )}

        {footer && (
          <FadeInUp delay={0.2} className="mt-12 w-full sm:mt-16">
            {footer}
          </FadeInUp>
        )}
      </Container>
    </section>
  );
}
