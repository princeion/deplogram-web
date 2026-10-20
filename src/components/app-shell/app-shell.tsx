import { Suspense, type ReactNode } from "react"
import { cookies } from "next/headers"

import { SidebarInset } from "@/components/ui/sidebar"
import { GalleySidebarProvider } from "@/components/app-shell/sidebar-state"
import { AppHeader } from "@/components/app-shell/app-header"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { NavigationProgress } from "@/components/app-shell/navigation-progress"
import { PageScrollbar } from "@/components/app-shell/page-scrollbar"
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider"
import { ConfirmProvider } from "@/components/feedback/confirm"

/** Same name the shadcn SidebarProvider writes when the sidebar is toggled. */
const SIDEBAR_COOKIE = "sidebar_state"

/**
 * The Galley frame: navigation progress, command palette (⌘K), sidebar, header and page. Reads
 * the sidebar's saved state on the server so the first paint already has the right width.
 */
export async function AppShell({ children, sidebarFooter }: { children: ReactNode; sidebarFooter?: ReactNode }) {
  const defaultOpen = (await cookies()).get(SIDEBAR_COOKIE)?.value !== "false"

  return (
    <GalleySidebarProvider defaultOpen={defaultOpen} className="bg-app-frame">
      {/* Inside SidebarProvider: palette commands can toggle the sidebar. */}
      <CommandPaletteProvider>
        <ConfirmProvider>
          {/* Reads search params, so it needs its own Suspense boundary. */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <AppSidebar footer={sidebarFooter} />
          <SidebarInset className="bg-app-frame">
            <AppHeader />
            {/*
              The content panel. The page itself scrolls (native scrolling, a page-level scrollbar in
              the right gutter), but the frame stays put: the header is sticky, and a "corner cap"
              pinned under it keeps drawing the panel's rounded top, so content slides under the
              rounded edge. The cap's outer shadow, in the frame colour, fills the corners outside the
              curve; `overflow-clip` keeps that shadow inside the panel column (and keeps sticky working).
            */}
            <div className="relative flex flex-1 flex-col overflow-clip md:mr-3.5">
              <div
                aria-hidden
                className="pointer-events-none sticky top-14 z-20 -mb-4 h-4 shrink-0 rounded-t-2xl border-x border-t border-border/60 shadow-[0_-16px_0_16px_var(--app-frame)]"
              />
              <div className="flex-1 rounded-t-2xl border-x border-border/60 bg-app-panel">{children}</div>
            </div>
          </SidebarInset>
          <PageScrollbar />
        </ConfirmProvider>
      </CommandPaletteProvider>
    </GalleySidebarProvider>
  )
}
