import type { ApiItem } from "@/content/apis"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ApiBento } from "@/components/marketing/api-bento"
import { ApiExplorer } from "@/components/marketing/api-explorer"
import { SectionHeader } from "@/components/marketing/section-header"

type ApiShowcaseProps = {
  eyebrow: string
  title: string
  description: string
  apis: readonly ApiItem[]
}

/** The built-in APIs as a bento grid, plus a tabbed look at how each one is called. */
export function ApiShowcase({ eyebrow, title, description, apis }: ApiShowcaseProps) {
  return (
    <SectionWrapper id="apis">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <ApiBento apis={apis} className="mt-12 sm:mt-16" />
        <FadeInUp className="mt-12 flex flex-col gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <h3 className="font-heading text-subheading font-semibold">One SDK, already authenticated</h3>
            <p className="text-sm text-pretty text-muted-foreground">
              Call the APIs from any stack with one API key — or from a Deplogram deployment, where the key is
              injected for you. Usage for every API shows up in one dashboard.
            </p>
            {/* TODO: remove once the SDK surface is final. */}
            <p className="text-xs text-muted-foreground">Snippets are illustrative and may change before GA.</p>
          </div>
          <ApiExplorer apis={apis} />
        </FadeInUp>
      </Container>
    </SectionWrapper>
  )
}
