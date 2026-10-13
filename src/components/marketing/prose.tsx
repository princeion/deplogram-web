import * as React from "react"

import { cn } from "@/lib/utils"
import { slugify } from "@/lib/format"
import type { ContentBlock } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { CodePreview } from "@/components/marketing/code-preview"
import { InlineText } from "@/components/marketing/inline-text"

/** The one long-form typography recipe — blog articles, docs and legal pages. */
export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 text-base leading-relaxed text-pretty text-muted-foreground",
        "[&_h2]:mt-8 [&_h2]:scroll-mt-28 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-foreground",
        "[&_h3]:mt-4 [&_h3]:font-heading [&_h3]:text-subheading [&_h3]:font-medium [&_h3]:text-foreground",
        "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-brand-ink",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return (
              <p key={i}>
                <InlineText text={block.text} />
              </p>
            )
          case "h2":
            return (
              <h2 key={i} id={slugify(block.text)}>
                {block.text}
              </h2>
            )
          case "h3":
            return <h3 key={i}>{block.text}</h3>
          case "ul":
          case "ol": {
            const List = block.type
            return (
              <List key={i}>
                {block.items.map((item) => (
                  <li key={item}>
                    <InlineText text={item} />
                  </li>
                ))}
              </List>
            )
          }
          case "code":
            return <CodePreview key={i} title={block.title ?? "code"} code={block.code} className="my-2" />
          case "callout":
            return (
              <aside key={i} className="flex gap-3 border border-border/70 bg-card p-4 text-sm">
                <Icon name="sparkles" className="mt-0.5 text-brand-ink" />
                <div className="flex flex-col gap-1">
                  {block.title && <p className="font-medium text-foreground">{block.title}</p>}
                  <p>
                    <InlineText text={block.text} />
                  </p>
                </div>
              </aside>
            )
        }
      })}
    </>
  )
}

/** h2 headings of a document, for "On this page" navigation. */
export function getHeadings(blocks: readonly ContentBlock[]) {
  return blocks.flatMap((block) => (block.type === "h2" ? [{ id: slugify(block.text), text: block.text }] : []))
}
