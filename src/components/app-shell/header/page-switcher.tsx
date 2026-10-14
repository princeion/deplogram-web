"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

import type { ResolvedNavItem, ResolvedNavScope } from "@/lib/navigation"
import { Icon } from "@/components/shared/icon"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { CrumbTrigger } from "@/components/app-shell/header/crumb"

/**
 * Last breadcrumb segment: the current page, opening a menu of its sibling pages in the same
 * scope (e.g. Logs → Metrics, Environment). Built from the navigation registry.
 */
export function PageSwitcher({ scope, current, className }: { scope: ResolvedNavScope; current: ResolvedNavItem; className?: string }) {
  const siblings = scope.sections.flatMap((section) => section.items).filter((item) => !item.soon)

  if (siblings.length < 2) {
    return (
      <li aria-current="page" className={cn("inline-flex h-8 min-w-0 items-center px-2 text-sm font-medium", className)}>
        <span className="truncate">{current.label}</span>
      </li>
    )
  }

  return (
    <li aria-current="page" className={cn("min-w-0", className)}>
      <DropdownMenu>
        <CrumbTrigger label={`Page: ${current.label}`}>
          <span className="truncate">{current.label}</span>
        </CrumbTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {siblings.map((item) => (
            <DropdownMenuItem key={item.id} render={item.external ? <a href={item.href} target="_blank" rel="noreferrer" /> : <Link href={item.href} />}>
              {item.icon && <Icon name={item.icon} filled={item.active} />}
              <span className="truncate">{item.label}</span>
              {item.active && <Icon name="check" size="xs" className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
