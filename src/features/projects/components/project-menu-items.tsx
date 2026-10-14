"use client"

import Link from "next/link"

import { useProjects, type ProjectSummary } from "@/features/projects/projects"
import { deploymentStatusMeta } from "@/features/deployments/components/deployment-status"
import { Icon } from "@/components/shared/icon"
import { StatusDot } from "@/components/shared/status-dot"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

/** The project's current state (its latest deployment), as an animated status dot. */
export function ProjectStateDot({ state, className }: { state: ProjectSummary["state"]; className?: string }) {
  const { tone, motion } = deploymentStatusMeta(state)
  return <StatusDot tone={tone} motion={motion} size="sm" className={className} />
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
