import { Suspense, type ReactNode } from "react"
import { cookies } from "next/headers"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/app-shell/app-header"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { NavigationProgress } from "@/components/app-shell/navigation-progress"
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider"

/** Same name the shadcn SidebarProvider writes when the sidebar is toggled. */
const SIDEBAR_COOKIE = "sidebar_state"

/**
 * The Galley frame: navigation progress, command palette (⌘K), sidebar, header and page. Reads
 * the sidebar's saved state on the server so the first paint already has the right width.
 */
export async function AppShell({ children, sidebarFooter }: { children: ReactNode; sidebarFooter?: ReactNode }) {
  const defaultOpen = (await cookies()).get(SIDEBAR_COOKIE)?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="bg-app-frame">
      {/* Inside SidebarProvider: palette commands can toggle the sidebar. */}
      <CommandPaletteProvider>
        {/* Reads search params, so it needs its own Suspense boundary. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AppSidebar footer={sidebarFooter} />
        <SidebarInset className="bg-app-frame">
          <AppHeader />
          {/* The raised content panel: the frame (sidebar + header) sits a step darker around it. */}
          <div className="flex-1 rounded-t-2xl border-t border-border/60 bg-app-panel md:mr-2 md:mb-2 md:rounded-2xl md:border">{children}</div>
        </SidebarInset>
      </CommandPaletteProvider>
    </SidebarProvider>
  )
}
