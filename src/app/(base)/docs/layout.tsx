import { docsNav } from "@/content/docs"
import { Container } from "@/components/shared/container"
import { DocsSidebar } from "@/components/marketing/docs-sidebar"

/** Docs shell: sidebar + article column, under the shared marketing navbar/footer. */
export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <Container className="grid gap-10 pt-28 pb-20 sm:pt-32 lg:grid-cols-[14rem_1fr] lg:gap-16">
      <aside className="border-b border-border/70 pb-8 lg:border-b-0 lg:pb-0">
        <DocsSidebar sections={docsNav} />
      </aside>
      <div className="min-w-0">{children}</div>
    </Container>
  )
}
