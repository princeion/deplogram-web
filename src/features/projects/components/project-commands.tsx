"use client"

import * as React from "react"
import { toast } from "sonner"

import { useProjects } from "@/features/projects/projects"
import { useDeployment } from "@/features/deployments/deployments"
import { useDeploymentActions } from "@/features/deployments/components/use-deployment-actions"
import { useRegisterCommands } from "@/components/command-palette/command-palette-provider"
import type { CommandSource } from "@/components/command-palette/types"

/**
 * Contributes the current project's actions to the command palette while you're inside it —
 * the pattern any page can use (useRegisterCommands) to offer its own commands.
 */
export function ProjectCommands({ projectId }: { projectId: string }) {
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === projectId)
  const latest = useDeployment(project?.latest?.id ?? "")
  const { startRedeploy } = useDeploymentActions()
  // Latest function in a ref, so the command list isn't rebuilt on every render.
  const redeploy = React.useRef(startRedeploy)
  React.useEffect(() => {
    redeploy.current = startRedeploy
  })

  const source = React.useMemo<CommandSource>(() => {
    if (!project) return {}
    const group = project.name
    return {
      commands: [
        ...(project.url
          ? [
              { id: `project-visit:${project.id}`, label: `Visit ${project.url}`, group, kind: "action" as const, icon: "arrow-up-right" as const, href: `https://${project.url}`, external: true, keywords: ["open", "live", "url"] },
              {
                id: `project-copy-url:${project.id}`,
                label: "Copy deployment URL",
                group,
                kind: "action" as const,
                icon: "copy" as const,
                keywords: ["clipboard", "link"],
                perform: () => navigator.clipboard.writeText(`https://${project.url}`).then(() => toast.success("Deployment URL copied")),
              },
            ]
          : []),
        {
          id: `project-redeploy:${project.id}`,
          label: `Redeploy ${project.name}`,
          group,
          kind: "action" as const,
          icon: "rocket" as const,
          keywords: ["deploy", "restart", "build"],
          perform: () => {
            if (latest.data) void redeploy.current(latest.data)
          },
        },
      ],
    }
  }, [project, latest.data])

  useRegisterCommands("current-project", source)
  return null
}
