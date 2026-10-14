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
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* Inside SidebarProvider: palette commands can toggle the sidebar. */}
      <CommandPaletteProvider>
        {/* Reads search params, so it needs its own Suspense boundary. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AppSidebar footer={sidebarFooter} />
        <SidebarInset>
          <AppHeader />
          <div className="flex-1">{children}</div>
        </SidebarInset>
      </CommandPaletteProvider>
    </SidebarProvider>
  )
}
