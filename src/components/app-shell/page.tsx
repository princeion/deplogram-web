import type * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"

/**
 * Page layout primitives for Your Galley. Every page is:
 *
 *   <Page>
 *     <PageHeader title="Deployments" description="…" actions={<Button>…</Button>} />
 *     <PageSection title="Recent">…</PageSection>
 *   </Page>
 *
 * so spacing, widths and headings stay identical across the app.
 */

export const pageWidths = {
  /** Lists, overviews, most pages. */
  default: "max-w-6xl",
  /** Settings and forms — comfortable line length. */
  narrow: "max-w-3xl",
  /** Dense tables, dashboards. */
  wide: "max-w-[96rem]",
  /** Edge to edge — logs, CodePad. */
  full: "max-w-none",
} as const

export type PageWidth = keyof typeof pageWidths

/** Shared by Page and PageSkeleton so loading and loaded layouts line up exactly. */
export const pageContainerClass = "mx-auto grid w-full content-start gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"

export function Page({ width = "default", className, children }: { width?: PageWidth; className?: string; children: React.ReactNode }) {
  return <div className={cn(pageContainerClass, pageWidths[width], className)}>{children}</div>
}

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  /** Primary actions, right-aligned (wrap under the title on small screens). */
  actions?: React.ReactNode
  /** Small items beside the title — a status badge, a plan pill. */
  meta?: React.ReactNode
  /** Optional link above the title, for detail pages. */
  back?: { label: string; href: string }
  /** Rendered under the header row — tabs, filters. */
  children?: React.ReactNode
  className?: string
}

/** The page's title row. Titles are plain and technical (brief §3). */
export function PageHeader({ title, description, actions, meta, back, children, className }: PageHeaderProps) {
  return (
    <header className={cn("grid gap-4", className)}>
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="arrow-left" size="xs" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="grid min-w-0 gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
            {meta}
          </div>
          {description && <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

type PageSectionProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned link or button in the section heading ("View all"). */
  actions?: React.ReactNode
  /** "card" wraps the content in a bordered panel. */
  variant?: "plain" | "card"
  id?: string
  className?: string
  children: React.ReactNode
}

/** A titled block within a page. */
export function PageSection({ title, description, actions, variant = "plain", id, className, children }: PageSectionProps) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn("grid content-start gap-3", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="grid gap-0.5">
            {title && (
              <h2 id={headingId} className="text-base font-medium tracking-tight">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {variant === "card" ? <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-6">{children}</div> : children}
    </section>
  )
}
