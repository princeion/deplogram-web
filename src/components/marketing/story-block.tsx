import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { SectionHeader } from "@/components/marketing/section-header"

type StoryBlockProps = {
  eyebrow: string
  title: string
  paragraphs: readonly string[]
  /** Pull-quote rendered large under the story. */
  mission?: string
}

/** Two-column narrative: header left, paragraphs right, optional mission statement below. */
export function StoryBlock({ eyebrow, title, paragraphs, mission }: StoryBlockProps) {
  return (
    <SectionWrapper spacing="compact">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <FadeInUp className="flex flex-col gap-5 text-lead text-pretty text-muted-foreground">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </FadeInUp>
        {mission && (
          <FadeInUp className="border-t border-border/70 pt-10 lg:col-span-2">
            <p className="max-w-4xl font-heading text-heading font-semibold text-balance">
              <span className="text-brand-ink">“</span>
              {mission}
              <span className="text-brand-ink">”</span>
            </p>
          </FadeInUp>
        )}
      </Container>
    </SectionWrapper>
  )
}
