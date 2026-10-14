"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useSignOut, useViewer } from "@/features/auth/session"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Icon } from "@/components/shared/icon"
import { startNavigationProgress } from "@/components/app-shell/navigation-progress"

function initials(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

/** The signed-in user's menu. The session comes from the Deplogram backend (see features/auth). */
export function AccountMenu() {
  const router = useRouter()
  const { data: viewer, isPending } = useViewer()
  const signOut = useSignOut()

  if (isPending) return <Skeleton className="size-8 rounded-full" />

  if (!viewer) {
    return (
      <Link href="/signin?callbackUrl=/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Sign in
      </Link>
    )
  }

  const label = viewer.name || viewer.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {viewer.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars come from the user's Git provider
          <img src={viewer.image} alt="" className="size-full object-cover" />
        ) : (
          initials(label)
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{label}</span>
            {viewer.name && <span className="truncate text-xs font-normal text-muted-foreground">{viewer.email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <Icon name="user" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/" />}>
          <Icon name="home" />
          Deplogram home
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: () => {
                startNavigationProgress()
                router.push("/")
              },
            })
          }
        >
          <Icon name="logout" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
