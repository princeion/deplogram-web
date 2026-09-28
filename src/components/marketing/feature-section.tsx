import * as React from "react"

import type { FeatureItem } from "@/content/types"
import { BadgePill } from "@/components/shared/badge-pill"
import { Container } from "@/components/shared/container"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { FeatureGrid } from "@/components/marketing/feature-grid"
import { FeatureList } from "@/components/marketing/feature-list"
import { FeatureMatrix } from "@/components/marketing/feature-matrix"
import { SectionHeader } from "@/components/marketing/section-header"

type FeatureSectionProps = {
  id?: string
  eyebrow: string
  title: string
  description?: string
  items: readonly FeatureItem[]
  /**
   * How the items render — see "Feature layouts" in docs/design-system.md.
   * cards: Surface cards (default) · matrix: numbered hairline grid · list: borderless icon list.
   */
  display?: "cards" | "matrix" | "list"
  /** Card grid columns (display="cards" only). */
  columns?: 2 | 3 | 4
  /** Secondary capabilities rendered as a pill row under the grid. */
  extras?: readonly string[]
  extrasLabel?: string
  /** Rendered between the grid and the extras (e.g. an interactive demo). */
  children?: React.ReactNode
}

/** SectionHeader + feature items (+ optional pill row). Reused across home, pricing, about and careers. */
export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  items,
  display = "cards",
  columns,
  extras,
  extrasLabel = "Also included",
  children,
}: FeatureSectionProps) {
  const gridClass = "mt-12 sm:mt-16"
  return (
    <SectionWrapper id={id}>
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        {display === "matrix" && <FeatureMatrix items={items} className={gridClass} />}
        {display === "list" && <FeatureList items={items} className={gridClass} />}
        {display === "cards" && <FeatureGrid items={items} columns={columns} className={gridClass} />}
        {children}
        {extras && extras.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="shrink-0 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
              {extrasLabel}
            </p>
            <StaggerGroup as="ul" className="flex flex-wrap gap-2">
              {extras.map((extra) => (
                <StaggerItem as="li" key={extra}>
                  <BadgePill>{extra}</BadgePill>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        )}
      </Container>
    </SectionWrapper>
  )
}
