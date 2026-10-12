import * as React from "react"

import { Container } from "@/components/shared/container"
import { GradientBackground } from "@/components/shared/gradient-background"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { NodeTexture } from "@/components/shared/node-texture"
import { AccentText } from "@/components/shared/accent-text"
import { Eyebrow } from "@/components/shared/eyebrow"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  /** Actions or meta rendered under the description. */
  children?: React.ReactNode
}

/** Every sub-page opens with this: eyebrow + text-title h1 + lead over the dotted grid. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16">
      <GradientBackground />
      <NodeTexture className="top-16 -right-32 hidden w-136 md:block" />
      <Container className="relative">
        <FadeInUp className="flex max-w-3xl flex-col items-start">
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <h1 className="font-heading text-title font-semibold text-balance">
            <AccentText text={title} />
          </h1>
          {description && <p className="mt-5 max-w-2xl text-lead text-pretty text-muted-foreground">{description}</p>}
          {children && <div className="mt-8 w-full">{children}</div>}
        </FadeInUp>
      </Container>
    </header>
  )
}
