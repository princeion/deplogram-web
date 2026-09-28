import type { FeatureItem } from "@/content/types"
import { Container } from "@/components/shared/container"
import { NodeGraph } from "@/components/shared/node-graph"
import { NodeTexture } from "@/components/shared/node-texture"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps"
import { SectionHeader } from "@/components/marketing/section-header"

type HowItWorksProps = {
  eyebrow: string
  title: string
  description: string
  steps: readonly FeatureItem[]
}

/** The developer workflow as a scroll-linked vertical timeline, header pinned alongside on desktop. */
export function HowItWorks({ eyebrow, title, description, steps }: HowItWorksProps) {
  return (
    <SectionWrapper id="how-it-works" className="overflow-hidden">
      <NodeTexture className="-bottom-20 -left-40 w-160" />
      <Container className="relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeader eyebrow={eyebrow} title={title} description={description} />
          <NodeGraph
            layout="workflow"
            state="loading"
            className="mt-12 hidden max-w-md lg:block"
            title="Workflow: utility, API, deploy, store, domain, scale"
          />
        </div>
        <HowItWorksSteps steps={steps} />
      </Container>
    </SectionWrapper>
  )
}
