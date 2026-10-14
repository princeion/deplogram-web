"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { useProjects, type ProjectSummary } from "@/features/projects/projects"
import { Icon } from "@/components/shared/icon"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

/** Status dot colour per deployment state: live, in progress, failed, waiting. */
export const projectStateDot: Record<ProjectSummary["state"], string> = {
  QUEUED: "bg-muted-foreground",
  BUILDING: "bg-brand",
  BUILT: "bg-brand",
  DEPLOYING: "bg-brand",
  RUNNING: "bg-success",
  BUILD_FAILED: "bg-destructive",
  DEPLOY_FAILED: "bg-destructive",
  CRASHED: "bg-destructive",
}

export function ProjectStateDot({ state, className }: { state: ProjectSummary["state"]; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", projectStateDot[state], className)} />
}

/** The user's projects as dropdown items, with loading, error and empty states. */
export function ProjectMenuItems({ currentId, onSelect }: { currentId?: string; onSelect?: () => void }) {
  const { data: projects, isPending, isError } = useProjects()

  if (isPending) {
    return (
      <div className="grid gap-1 p-1" aria-busy="true" aria-label="Loading projects">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 rounded-sm" />
        ))}
      </div>
    )
  }
  if (isError) return <p className="px-2 py-1.5 text-sm text-muted-foreground">Couldn&apos;t load projects.</p>
  if (projects.length === 0) return <p className="px-2 py-1.5 text-sm text-muted-foreground">No projects yet.</p>

  return projects.map((project) => (
    <DropdownMenuItem key={project.id} render={<Link href={`/dashboard/projects/${project.id}`} onClick={onSelect} />}>
      <ProjectStateDot state={project.state} />
      <span className="truncate">{project.name}</span>
      {project.id === currentId && <Icon name="check" size="xs" className="ml-auto" />}
    </DropdownMenuItem>
  ))
}
