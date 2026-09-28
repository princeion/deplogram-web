import type { FaqItem } from "@/content/faq"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { SectionHeader } from "@/components/marketing/section-header"

type FaqProps = {
  eyebrow?: string
  title: string
  items: readonly FaqItem[]
}

/** FAQ accordion (shadcn/Base UI — keyboard + aria handled by the primitive). */
export function Faq({ eyebrow = "FAQ", title, items }: FaqProps) {
  return (
    <SectionWrapper>
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <FadeInUp>
          <Accordion className="rounded-2xl elevation-surface px-6">
            {items.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="py-5 text-base font-medium hover:no-underline">{item.question}</AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeInUp>
      </Container>
    </SectionWrapper>
  )
}
