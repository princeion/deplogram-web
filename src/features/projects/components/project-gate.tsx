"use client"

import * as React from "react"
import Link from "next/link"
import type { UseQueryResult } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import type { Project } from "@/features/projects/projects"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/app-shell/empty-state"
import { ErrorState } from "@/components/app-shell/error-state"

/**
 * Every project tab starts here: a skeleton while the project loads, "doesn't exist" for a 404
 * (deleted, or a bad link), a retry for anything else — then the tab, given the project.
 */
export function ProjectGate({ query, children }: { query: UseQueryResult<Project>; children: (project: Project) => React.ReactNode }) {
  if (query.isPending) {
    return (
      <div className="grid gap-6" aria-busy="true">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }
  if (query.error && !query.data) {
    return query.error instanceof ApiError && query.error.status === 404 ? (
      <EmptyState
        icon="folder"
        title="This project doesn't exist."
        description="It may have been deleted, or the link is wrong."
        actions={
          <Link href="/dashboard/projects" className={cn(buttonVariants({ variant: "outline" }))}>
            All projects
          </Link>
        }
      />
    ) : (
      <ErrorState title="This project didn't load." onRetry={() => query.refetch()} />
    )
  }
  return <>{children(query.data!)}</>
}
