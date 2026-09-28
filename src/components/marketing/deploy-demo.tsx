import type { TerminalLine } from "@/components/shared/motion/terminal-typing"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { DeployPreview } from "@/components/marketing/deploy-preview"
import { SectionHeader } from "@/components/marketing/section-header"

type DeployDemoProps = {
  eyebrow: string
  title: string
  description: string
  /** Typed by the terminal; each line's `step` lights the next pipeline node. */
  log: readonly TerminalLine[]
}

/** A live-looking deploy: terminal log and pipeline graph in sync. Anchor for /#deploy. */
export function DeployDemo({ eyebrow, title, description, log }: DeployDemoProps) {
  return (
    <SectionWrapper id="deploy">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} align="center" />
        <FadeInUp className="mt-12 sm:mt-16" distance={24}>
          <DeployPreview log={log} />
        </FadeInUp>
      </Container>
    </SectionWrapper>
  )
}
