import { createMetadata } from "@/lib/metadata"
import { docPages } from "@/content/docs"
import { runtimes } from "@/content/runtimes"
import { BadgePill } from "@/components/shared/badge-pill"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { LinkCardGrid } from "@/components/marketing/link-card-grid"
import { Eyebrow } from "@/components/shared/eyebrow"

export const metadata = createMetadata({
  title: "Documentation",
  description: "Learn how to use Deplogram — API keys, developer utilities, storage, domains and shipping your first project on dpl.app.",
  path: "/docs",
})

export default function DocsIndexPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-12">
      <FadeInUp>
        <Eyebrow className="mb-3">Documentation</Eyebrow>
        <h1 className="font-heading text-title font-semibold text-balance">Deplogram docs</h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          Everything you need to go from a GitHub repo to a live URL. Start with the basics — the platform and API
          references are on their way.
        </p>
      </FadeInUp>

      <LinkCardGrid
        items={docPages.map((page) => ({
          title: page.title,
          description: page.description,
          href: page.href,
          icon: page.icon,
        }))}
      />

      <FadeInUp className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">Supported runtimes</h2>
        <ul className="flex flex-wrap gap-2">
          {runtimes.map((runtime) => (
            <li key={runtime.name}>
              <BadgePill>{runtime.name}</BadgePill>
            </li>
          ))}
        </ul>
      </FadeInUp>
    </div>
  )
}
