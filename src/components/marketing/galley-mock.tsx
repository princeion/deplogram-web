import type * as React from "react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/site"
import { galleyNav, galleyProjects } from "@/content/workspace"
import { Icon } from "@/components/shared/icon"
import { ProductWindow, StateBadge } from "@/components/marketing/product-window"

/**
 * Your Galley — the workspace. Technical navigation stays recognisable (brief §3); the only
 * personality is the workspace name and the empty state.
 */
export function GalleyMock({ className }: { className?: string }) {
  return (
    <ProductWindow title="your galley / projects" className={className} bodyClassName="grid md:grid-cols-[12rem_1fr]">
      <aside className="hidden flex-col border-r border-border/70 bg-background/60 md:flex">
        <p className="border-b border-border/70 px-4 py-4 font-heading text-base font-semibold tracking-tight">Your Galley</p>
        <nav aria-label="Galley (preview)" className="flex flex-col py-2">
          {galleyNav.map((item, i) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2 text-sm",
                i === 0 ? "border-l-2 border-brand bg-card font-medium text-foreground" : "border-l-2 border-transparent text-muted-foreground"
              )}
            >
              <Icon name={item.icon} size="xs" />
              {item.label}
            </span>
          ))}
        </nav>
        <div className="mt-auto border-t border-border/70 px-4 py-4">
          <p className="font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Storage</p>
          <p className="mt-2 text-xs text-muted-foreground">312 MB used</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-brand" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <p className="font-heading text-lg font-semibold tracking-tight">Projects</p>
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-foreground px-3.5 text-xs font-medium text-background">
            <Icon name="plus" size="xs" />
            New deployment
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">
                <th scope="col" className="px-5 py-2.5 font-medium">Project</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Runtime</th>
                <th scope="col" className="px-5 py-2.5 font-medium">State</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {galleyProjects.map((project) => (
                <tr key={project.name} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-3.5">
                    <span className="grid gap-0.5">
                      <span className="font-medium">{project.name}</span>
                      <span className="font-mono text-[0.6875rem] text-muted-foreground">
                        {project.state === "RUNNING" ? `${project.name}.${siteConfig.deployDomain}` : `${project.branch} branch`}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{project.runtime}</td>
                  <td className="px-5 py-3.5">
                    <StateBadge state={project.state} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">{project.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto border-t border-border/70">
          <p className="px-5 pt-4 pb-2 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Recent activity</p>
          <ul className="px-5 pb-4 font-mono text-[0.6875rem] leading-relaxed">
            <li className="flex gap-3">
              <span className="text-muted-foreground/60">14:02</span>
              <span>orders-api → <span className="text-success">RUNNING</span></span>
            </li>
            <li className="flex gap-3">
              <span className="text-muted-foreground/60">14:01</span>
              <span>admin-dashboard → <span className="text-brand-ink">BUILDING</span></span>
            </li>
            <li className="flex gap-3">
              <span className="text-muted-foreground/60">12:48</span>
              <span>docs-site → <span className="text-destructive">BUILD_FAILED</span> · missing build script</span>
            </li>
          </ul>
        </div>
      </div>
    </ProductWindow>
  )
}

/** The empty Galley (brief §3): one line of personality, then a plain action. */
export function GalleyEmptyState({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-lg elevation-control">
        <Icon name="rocket" size="md" className="text-brand-ink" />
      </span>
      <p className="font-heading text-2xl font-semibold tracking-tight">No projects yet.</p>
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">Projects you deploy will show up here, with their state and deployment URL.</p>
      {children}
    </div>
  )
}
