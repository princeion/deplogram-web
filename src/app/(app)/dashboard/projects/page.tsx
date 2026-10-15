import type { Metadata } from "next"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"
import { Page, PageHeader } from "@/components/app-shell/page"
import { ProjectsList } from "@/features/projects/components/projects-list"

export const metadata: Metadata = {
  title: "Projects",
}

export default function ProjectsPage() {
  return (
    <Page width="wide">
      <PageHeader
        title="Projects"
        description="Everything you've deployed, with its latest deployment and track record."
        actions={
          <Link href="/dashboard/new" className={cn(buttonVariants())}>
            <Icon name="plus" />
            New deployment
          </Link>
        }
      />
      <ProjectsList />
    </Page>
  )
}
