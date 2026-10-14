"use client"

import { usePathname } from "next/navigation"

import { useAppNavigation } from "@/lib/navigation/use-navigation"
import { EmptyState } from "@/components/app-shell/empty-state"
import { Page, PageHeader } from "@/components/app-shell/page"

/** Placeholder for a route that exists in the navigation but has no page yet. */
export function PendingPage() {
  const pathname = usePathname()
  const { trail } = useAppNavigation()
  const current = trail.at(-1)

  return (
    <Page>
      <PageHeader title={current?.label ?? "Not found"} />
      <EmptyState
        icon={current?.icon ?? "layers"}
        title={current ? "This page isn't built yet." : "This page isn't in the navigation."}
        description={<code className="font-mono text-xs">{pathname}</code>}
      />
    </Page>
  )
}
