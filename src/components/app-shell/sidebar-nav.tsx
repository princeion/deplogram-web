"use client"

import * as React from "react"
import Link, { useLinkStatus } from "next/link"

import { cn } from "@/lib/utils"
import type { ResolvedNavItem, ResolvedNavSection } from "@/lib/navigation"
import { Icon } from "@/components/shared/icon"
import { Spinner } from "@/components/ui/spinner"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

/** Small spinner inside a nav link while its page is loading (must render inside the <Link>). */
function PendingIndicator() {
  const { pending } = useLinkStatus()
  return pending ? <Spinner decorative className="ml-auto size-3.5 text-muted-foreground" /> : null
}

/** The element a nav entry renders as: Next link, external link, or nothing for "soon". */
function linkFor(item: ResolvedNavItem, onNavigate: () => void) {
  if (item.soon) return undefined
  if (item.external) return <a href={item.href} target="_blank" rel="noreferrer" />
  return <Link href={item.href} onClick={onNavigate} />
}

function NavEntry({ item }: { item: ResolvedNavItem }) {
  const { isMobile, setOpenMobile } = useSidebar()
  // Close the mobile sheet after choosing a page.
  const onNavigate = () => isMobile && setOpenMobile(false)

  const children = item.items ?? []
  const hasChildren = children.length > 0
  // Sub-lists start open when you're inside them, and open themselves when you navigate in.
  const [open, setOpen] = React.useState(item.active)
  React.useEffect(() => {
    if (item.active) setOpen(true)
  }, [item.active])

  const badge = item.soon ? "Soon" : item.badge
  const subId = `nav-sub-${item.id}`

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={linkFor(item, onNavigate)}
        isActive={item.active}
        tooltip={item.label}
        aria-current={item.active ? "page" : undefined}
        aria-disabled={item.soon || undefined}
      >
        {item.icon && <Icon name={item.icon} filled={item.active} />}
        <span>{item.label}</span>
        {item.external && <Icon name="arrow-up-right" size="xs" className="ml-auto text-muted-foreground" />}
        {!item.soon && !item.external && <PendingIndicator />}
      </SidebarMenuButton>

      {hasChildren ? (
        <SidebarMenuAction
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={subId}
          aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
        >
          <Icon name="chevron-right" className={cn("transition-transform duration-200", open && "rotate-90")} />
        </SidebarMenuAction>
      ) : (
        badge && <SidebarMenuBadge className="text-muted-foreground">{badge}</SidebarMenuBadge>
      )}

      {hasChildren && open && (
        <SidebarMenuSub id={subId}>
          {children.map((child) => (
            <SidebarMenuSubItem key={child.id}>
              <SidebarMenuSubButton
                render={linkFor(child, onNavigate)}
                isActive={child.active}
                aria-current={child.active ? "page" : undefined}
                aria-disabled={child.soon || undefined}
              >
                <span>{child.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

/** Renders resolved navigation sections as sidebar groups. Labels hide when collapsed to the rail. */
export function SidebarNav({ sections, className }: { sections: readonly ResolvedNavSection[]; className?: string }) {
  return sections.map((section) => (
    <SidebarGroup key={section.id} className={className}>
      {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <NavEntry key={item.id} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
