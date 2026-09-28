import type { Runtime } from "@/content/runtimes"
import { BadgePill } from "@/components/shared/badge-pill"
import { Container } from "@/components/shared/container"
import { Eyebrow } from "@/components/shared/eyebrow"
import { Icon } from "@/components/shared/icon"
import { Marquee } from "@/components/shared/motion/marquee"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { SectionHeader } from "@/components/marketing/section-header"

type RuntimesStripProps = {
  eyebrow: string
  /** With a title it's a full section; without, a compact label + marquee (e.g. the hero's bottom row). */
  title?: string
  runtimes: readonly Runtime[]
}

/** The supported runtimes as a pill marquee. */
export function RuntimesStrip({ eyebrow, title, runtimes }: RuntimesStripProps) {
  const marquee = (
    <Marquee duration="45s">
      {runtimes.map((runtime) => (
        <BadgePill key={runtime.name} size="md" className="gap-2.5 text-foreground">
          <Icon name={runtime.icon} className="text-brand-ink" />
          {runtime.name}
          {runtime.detail && <span className="text-muted-foreground">· {runtime.detail}</span>}
        </BadgePill>
      ))}
    </Marquee>
  )

  if (!title) {
    return (
      <div id="runtimes" className="flex flex-col gap-5">
        <Eyebrow className="text-center text-muted-foreground">{eyebrow}</Eyebrow>
        {marquee}
      </div>
    )
  }

  return (
    <SectionWrapper id="runtimes" spacing="compact">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} align="center" />
      </Container>
      <div className="mt-10">{marquee}</div>
    </SectionWrapper>
  )
}
