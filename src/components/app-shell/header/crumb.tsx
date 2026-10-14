"use client"

import type * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/shared/icon"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const crumbClass =
  "inline-flex h-8 max-w-56 min-w-0 items-center gap-2 rounded-md px-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"

/** The "/" between breadcrumb segments. */
export function CrumbSeparator({ className }: { className?: string }) {
  return (
    <li aria-hidden className={cn("text-lg font-light text-muted-foreground/40 select-none", className)}>
      /
    </li>
  )
}

/** A breadcrumb segment that opens a switcher menu (use inside a DropdownMenu). */
export function CrumbTrigger({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <DropdownMenuTrigger aria-label={label} className={cn(crumbClass, className)}>
      {children}
      <Icon name="chevrons-up-down" size="xs" className="shrink-0 text-muted-foreground" />
    </DropdownMenuTrigger>
  )
}

/** A plain breadcrumb link (no menu). */
export function CrumbLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(crumbClass, "font-normal text-muted-foreground hover:text-foreground", className)}>
      {children}
    </Link>
  )
}
