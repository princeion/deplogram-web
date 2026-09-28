import { cva } from "class-variance-authority"

import { formatDate } from "@/lib/format"
import type { ChangeType, ChangelogEntry } from "@/content/changelog"
import { BadgePill } from "@/components/shared/badge-pill"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { NodeDot } from "@/components/shared/node-graph"
import { SectionWrapper } from "@/components/shared/section-wrapper"

const changeTypeVariants = cva("w-20 shrink-0 font-mono text-xs uppercase tracking-eyebrow", {
  variants: {
    type: {
      new: "text-brand-ink",
      improved: "text-foreground",
      fixed: "text-muted-foreground",
    } satisfies Record<ChangeType, string>,
  },
})

/** Reverse-chronological release timeline. The rail's nodes are NodeDots; the newest is lit. */
export function ChangelogList({ entries }: { entries: readonly ChangelogEntry[] }) {
  return (
    <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
      <Container>
        <ol className="relative flex flex-col">
          {entries.map((entry, i) => (
            <li key={entry.version} className="relative grid gap-4 pb-14 md:grid-cols-[12rem_1fr] md:gap-10">
              <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2 md:pt-1">
                <time dateTime={entry.date} className="text-sm text-muted-foreground">
                  {formatDate(entry.date)}
                </time>
                <BadgePill variant="outline" className="font-mono">
                  v{entry.version}
                </BadgePill>
              </div>
              <FadeInUp className="relative border-l border-border pb-2 pl-8">
                <NodeDot lit={i === 0} className="absolute top-2 -left-[5.5px]" />
                <h2 className="font-heading text-2xl font-semibold text-balance">{entry.title}</h2>
                <p className="mt-3 text-pretty text-muted-foreground">{entry.summary}</p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {entry.changes.map((change) => (
                    <li key={change.text} className="flex gap-3">
                      <span className={changeTypeVariants({ type: change.type })}>{change.type}</span>
                      <span>{change.text}</span>
                    </li>
                  ))}
                </ul>
              </FadeInUp>
            </li>
          ))}
        </ol>
      </Container>
    </SectionWrapper>
  )
}
