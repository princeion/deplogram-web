"use client"

import Link from "next/link"

import { useProjects } from "@/features/projects/projects"
import { ProjectMenuItems, ProjectStateDot } from "@/features/projects/components/project-menu-items"
import { Icon } from "@/components/shared/icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { CrumbTrigger } from "@/components/app-shell/header/crumb"

/** Breadcrumb segment for the project you're in — switches to any other project. */
export function ProjectSwitcher({ projectId }: { projectId: string }) {
  const { data: projects, isPending } = useProjects()
  const project = projects?.find((p) => p.id === projectId)

  return (
    <li className="min-w-0">
      <DropdownMenu>
        <CrumbTrigger label={`Project: ${project?.name ?? projectId}`}>
          {isPending ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <>
              {project && <ProjectStateDot state={project.state} />}
              <span className="truncate">{project?.name ?? projectId}</span>
            </>
          )}
        </CrumbTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Projects</DropdownMenuLabel>
            <ProjectMenuItems currentId={projectId} />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/projects" />}>
            <Icon name="folder" />
            All projects
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/new" />}>
            <Icon name="plus" />
            New deployment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
