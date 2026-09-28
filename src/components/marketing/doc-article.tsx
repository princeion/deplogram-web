import Link from "next/link"

import type { DocPage } from "@/content/docs"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { ContentBlocks, Prose } from "@/components/marketing/prose"
import { Eyebrow } from "@/components/shared/eyebrow"

type DocArticleProps = {
  page: DocPage
  next?: { title: string; href: string }
}

/** A docs article: title, description, prose, and an optional "next" link. */
export function DocArticle({ page, next }: DocArticleProps) {
  return (
    <FadeInUp>
      <article className="max-w-3xl">
        <Eyebrow className="mb-3">Docs</Eyebrow>
        <h1 className="font-heading text-title font-semibold text-balance">{page.title}</h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">{page.description}</p>
        <Prose className="mt-10">
          <ContentBlocks blocks={page.blocks} />
        </Prose>
        {next && (
          <Link
            href={next.href}
            className="group mt-14 flex items-center justify-between rounded-2xl elevation-surface p-5 transition-colors hover:border-brand-ink/30"
          >
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">Next</span>
              <span className="font-heading font-semibold">{next.title}</span>
            </span>
            <Icon name="arrow-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
          </Link>
        )}
      </article>
    </FadeInUp>
  )
}
