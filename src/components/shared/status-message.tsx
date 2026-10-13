import * as React from "react"

import { Container } from "@/components/shared/container"
import { GradientBackground } from "@/components/shared/gradient-background"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { NodeGraph, type NodeGraphState } from "@/components/shared/node-graph"
import { Eyebrow } from "@/components/shared/eyebrow"

type StatusMessageProps = {
  eyebrow: string
  title: string
  description: string
  /** idle = broken/unknown path, loading = something in progress. */
  graphState?: NodeGraphState
  children?: React.ReactNode
}

/** Full-height centred message — 404, error and placeholder pages. */
export function StatusMessage({ eyebrow, title, description, graphState = "idle", children }: StatusMessageProps) {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden pt-32 pb-24 sm:pt-40">
      <GradientBackground />
      <Container className="relative flex flex-col items-center text-center">
        <FadeInUp className="flex flex-col items-center">
          <NodeGraph layout="pipeline" state={graphState} className="mb-10 w-full max-w-md" />
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <h1 className="max-w-2xl font-heading text-title font-medium text-balance">{title}</h1>
          <p className="mt-5 max-w-xl text-lead text-pretty text-muted-foreground">{description}</p>
          {children && <div className="mt-10 flex flex-col gap-3 sm:flex-row">{children}</div>}
        </FadeInUp>
      </Container>
    </section>
  )
}
