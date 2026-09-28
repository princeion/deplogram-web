import { formatDate } from "@/lib/format"
import type { LegalDocument } from "@/content/legal"
import { Container } from "@/components/shared/container"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { PageHeader } from "@/components/marketing/page-header"
import { ContentBlocks, getHeadings, Prose } from "@/components/marketing/prose"
import { TableOfContents } from "@/components/marketing/table-of-contents"

/** Shared layout for long-form legal pages: header, sticky contents, prose. */
export function LegalLayout({ document }: { document: LegalDocument }) {
  return (
    <>
      <PageHeader eyebrow="Legal" title={document.title} description={document.description}>
        <p className="text-sm text-muted-foreground">
          Last updated <time dateTime={document.updated}>{formatDate(document.updated)}</time>
        </p>
      </PageHeader>
      <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
        <Container className="grid gap-12 lg:grid-cols-[14rem_1fr]">
          <TableOfContents headings={getHeadings(document.blocks)} />
          <Prose className="max-w-3xl">
            <ContentBlocks blocks={document.blocks} />
          </Prose>
        </Container>
      </SectionWrapper>
    </>
  )
}
