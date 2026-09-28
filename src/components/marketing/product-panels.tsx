import * as React from "react"

import type { ProductPanel } from "@/content/platform"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { SectionHeader } from "@/components/marketing/section-header"

type ProductPanelsProps = {
  panels: readonly (ProductPanel & { visual: React.ReactNode })[]
}

/**
 * Stacked full-width panels for a pillar that needs more than a card: copy + checklist on one side,
 * an illustrative preview on the other. Each panel is its own anchor (/#storage, /#domains).
 */
export function ProductPanels({ panels }: ProductPanelsProps) {
  return (
    <SectionWrapper>
      <Container className="flex flex-col gap-4">
        {panels.map((panel, i) => (
          <FadeInUp key={panel.id}>
            <article
              id={panel.id}
              className="grid grid-cols-1 items-center gap-10 rounded-3xl elevation-surface p-6 sm:p-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <SectionHeader eyebrow={panel.eyebrow} title={panel.title} description={panel.description} />
                <StaggerGroup as="ul" className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
                  {panel.points.map((point) => (
                    <StaggerItem as="li" key={point} className="flex gap-3">
                      <Icon name="check" className="mt-0.5 text-brand-ink" />
                      <span>{point}</span>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>
              <div className="min-w-0">{panel.visual}</div>
            </article>
          </FadeInUp>
        ))}
      </Container>
    </SectionWrapper>
  )
}
