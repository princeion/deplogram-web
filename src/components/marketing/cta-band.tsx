import type { WaitlistSource } from "@/content/waitlist";
import { Container } from "@/components/shared/container";
import { FadeInUp } from "@/components/shared/motion/fade-in-up";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { WaitlistInline } from "@/components/marketing/waitlist-form";

type CtaBandProps = {
  title: string;
  description: string;
  source?: WaitlistSource;
};

/** Closing call to action on every page: a centred dark card with the waitlist form. */
export function CtaBand({ title, description, source = "cta" }: CtaBandProps) {
  return (
    <SectionWrapper>
      <Container>
        <FadeInUp>
          <div className="font-heading flex flex-col items-center rounded-3xl bg-muted/30 px-6 py-20 text-center ring-1 ring-border/60 sm:py-28">
            <h2 className="max-w-5xl  text-title font-medium text-balance">
              {title}
            </h2>
            <p className="mt-5 max-w-4xl text-lead text-pretty text-muted-foreground tracking-tight">
              {description}
            </p>
            <WaitlistInline
              source={source}
              className="mt-10 max-w-md"
              note="No spam. One email when your invite is ready."
            />
          </div>
        </FadeInUp>
      </Container>
    </SectionWrapper>
  );
}
