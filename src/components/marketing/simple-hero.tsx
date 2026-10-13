import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { Icon } from "@/components/shared/icon";
import { FadeInUp } from "@/components/shared/motion/fade-in-up";
import { TextReveal } from "@/components/shared/motion/text-reveal";

type HeroAction = { label: string; href: string };

type SimpleHeroProps = {
  /** Headline; `*highlight*` markers are ignored here — this hero stays plain. */
  title: string;
  primary: HeroAction;
  secondary?: HeroAction;
};

/** Minimal centred page opener: one big headline, two pill buttons, nothing else. */
export function SimpleHero({ title, primary, secondary }: SimpleHeroProps) {
  return (
    <header className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <Container className="flex flex-col items-center text-center">
        <TextReveal
          as="h1"
          immediate
          text={title.replaceAll("*", "")}
          className="max-w-4xl font-heading text-display font-medium text-balance"
        />
        <FadeInUp
          delay={0.3}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={primary.href}
            className={cn(
              buttonVariants({ variant: "inverted", size: "lg" }),
              "group h-11 px-6 text-base",
            )}
          >
            {primary.label}
            <Icon
              name="arrow-up-right"
              className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-11 px-6 text-base",
              )}
            >
              {secondary.label}
            </Link>
          )}
        </FadeInUp>
      </Container>
    </header>
  );
}
