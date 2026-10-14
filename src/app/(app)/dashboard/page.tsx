import Link from "next/link"
import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"
import { EmptyState } from "@/components/app-shell/empty-state"
import { Page, PageHeader } from "@/components/app-shell/page"

export const metadata: Metadata = {
  title: "Overview",
}

// TODO: projects and recent deployments once the projects API exists. Until then, the empty Galley.
export default function OverviewPage() {
  const newDeployment = (
    <Link href="/dashboard/new" className={cn(buttonVariants({ variant: "inverted" }))}>
      <Icon name="plus" />
      New deployment
    </Link>
  )

  return (
    <Page>
      <PageHeader title="Overview" description="Your projects and deployments at a glance." actions={newDeployment} />
      {/* Brief §3: one line of personality, then a plain action. */}
      <EmptyState
        icon="rocket"
        title="Nothing on the counter yet."
        description="Connect a GitHub repository, pick a runtime and get a live URL."
        actions={
          <Link href="/dashboard/new" className={cn(buttonVariants({ variant: "inverted" }))}>
            Deploy your first project
            <Icon name="arrow-right" />
          </Link>
        }
      />
    </Page>
  )
}
