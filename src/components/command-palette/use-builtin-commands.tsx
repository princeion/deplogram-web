"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { useAppNavigation } from "@/lib/navigation/use-navigation"
import { useSignOut } from "@/features/auth/session"
import { useProjects } from "@/features/projects/projects"
import { ProjectStateDot } from "@/features/projects/components/project-menu-items"
import { useSidebar } from "@/components/ui/sidebar"
import { startNavigationProgress } from "@/components/app-shell/navigation-progress"
import type { CommandSource, PaletteCommand } from "@/components/command-palette/types"

/**
 * The palette's built-in commands, derived from the app's own sources of truth: the navigation
 * registry (every page), the projects query, and a handful of global actions.
 */
export function useBuiltinCommands(): CommandSource {
  const router = useRouter()
  const params = useParams()
  const { all } = useAppNavigation()
  const { data: projects } = useProjects()
  const { resolvedTheme, setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const signOut = useSignOut()

  return React.useMemo(() => {
    const currentProjectId = typeof params.projectId === "string" ? params.projectId : undefined
    const currentProjectName = projects?.find((p) => p.id === currentProjectId)?.name ?? currentProjectId

    // Every page in the registry, once per href (index pages appear in several scopes).
    const seen = new Set<string>()
    const pages: PaletteCommand[] = all
      .filter(({ item }) => !item.soon && !seen.has(item.href) && seen.add(item.href))
      .map(({ item, scopeId, scopeTitle, help }) => ({
        id: `nav:${item.id}`,
        label: item.label,
        group: help ? "Help" : scopeId === "project" ? `In ${currentProjectName}` : "Pages",
        kind: help ? "help" : "page",
        icon: item.icon,
        subtitle: scopeTitle,
        keywords: item.keywords,
        href: item.href,
        external: item.external,
      }))

    const projectCommands: PaletteCommand[] = (projects ?? []).map((project) => ({
      id: `project:${project.id}`,
      label: project.name,
      group: "Projects",
      kind: "project",
      leading: <ProjectStateDot state={project.state} className="mx-[5px]" />,
      subtitle: project.url ?? project.state.toLowerCase().replace("_", " "),
      keywords: [project.runtime],
      href: `/dashboard/projects/${project.id}`,
      recent: true,
    }))

    const actions: PaletteCommand[] = [
      { id: "action:new-deployment", label: "New deployment", group: "Actions", kind: "action", icon: "plus", keywords: ["deploy", "create", "project"], href: "/dashboard/new" },
      { id: "action:switch-project", label: "Switch project…", group: "Actions", kind: "action", icon: "folder", keywords: ["project", "go to"], page: "projects" },
      { id: "action:theme", label: "Change theme…", group: "Actions", kind: "action", icon: resolvedTheme === "light" ? "sun" : "moon", keywords: ["dark", "light", "appearance"], page: "theme" },
      { id: "action:sidebar", label: "Toggle sidebar", group: "Actions", kind: "action", icon: "layout", shortcut: ["mod", "B"], keywords: ["collapse", "expand", "navigation"], perform: toggleSidebar },
      {
        id: "action:copy-link",
        label: "Copy link to this page",
        group: "Actions",
        kind: "action",
        icon: "link",
        keywords: ["url", "share", "clipboard"],
        perform: () =>
          navigator.clipboard.writeText(window.location.href).then(
            () => toast.success("Link copied"),
            () => toast.error("Couldn't copy the link")
          ),
      },
      {
        id: "action:sign-out",
        label: "Sign out",
        group: "Actions",
        kind: "action",
        icon: "logout",
        keywords: ["log out", "logout", "account"],
        perform: () =>
          signOut.mutate(undefined, {
            onSuccess: () => {
              startNavigationProgress()
              router.push("/")
            },
          }),
      },
    ]

    return {
      commands: [...pages, ...projectCommands, ...actions],
      pages: [
        { id: "projects", title: "Switch project", placeholder: "Search projects…", commands: projectCommands },
        {
          id: "theme",
          title: "Change theme",
          placeholder: "Choose a theme…",
          commands: (["dark", "light"] as const).map((theme) => ({
            id: `theme:${theme}`,
            label: theme === "dark" ? "Dark" : "Light",
            group: "Theme",
            kind: "action" as const,
            icon: theme === "dark" ? ("moon" as const) : ("sun" as const),
            subtitle: resolvedTheme === theme ? "Current" : undefined,
            perform: () => setTheme(theme),
          })),
        },
      ],
    }
  }, [all, projects, params.projectId, resolvedTheme, setTheme, toggleSidebar, signOut, router])
}
