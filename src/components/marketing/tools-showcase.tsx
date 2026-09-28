import type { FeatureItem } from "@/content/types"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { FeatureSection } from "@/components/marketing/feature-section"
import { ToolPlayground } from "@/components/marketing/tool-playground"

type ToolsShowcaseProps = {
  eyebrow: string
  title: string
  description: string
  tools: readonly FeatureItem[]
}

/** The utilities as a borderless icon list, plus a working playground for three of the tools. */
export function ToolsShowcase({ eyebrow, title, description, tools }: ToolsShowcaseProps) {
  return (
    <FeatureSection id="tools" eyebrow={eyebrow} title={title} description={description} items={tools} display="list">
      <FadeInUp className="mt-8 rounded-3xl elevation-surface p-4 sm:p-6">
        <ToolPlayground />
      </FadeInUp>
    </FeatureSection>
  )
}
