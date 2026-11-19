"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"

import { useViewer, type Viewer } from "@/features/auth/session"
import { Logo } from "@/components/shared/logo"

/**
 * A minimal, auth-specific loader — intentionally separate from `AppLoader` which is the
 * workspace/app-boot screen. This one only shows while we check the session cookie, before the
 * workspace is involved.
 */
function AuthLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      <Logo />
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="relative size-4"
        >
          <span className="absolute inset-0 rounded-full ring-2 ring-foreground/10 ring-inset" />
          <span
            className="absolute inset-0 animate-spin rounded-full [animation-duration:1.4s] motion-reduce:[animation-duration:4s]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, var(--foreground) 25%, transparent 50%)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px))",
            }}
          />
        </span>
        <p className="text-sm text-muted-foreground">Verifying your session…</p>
      </div>
    </div>
  )
}

/**
 * Gate for authenticated routes. Renders `children` when a valid session exists, redirects to
 * `/signin` otherwise. While the session is loading, it shows a lightweight auth-specific
 * loader — not the workspace "Connecting to Your Galley" screen.
 *
 * ```tsx
 * <RequireAuth>
 *   <Dashboard />
 * </RequireAuth>
 * ```
 *
 * Optional `role` prop restricts access to users with one of the listed roles. If the user is
 * signed in but doesn't have the right role, `fallback` is shown instead (defaults to null).
 */
export function RequireAuth({
  children,
  role,
  fallback = null,
}: {
  children: React.ReactNode
  role?: Viewer["role"] | Viewer["role"][]
  fallback?: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: viewer, isPending } = useViewer()

  React.useEffect(() => {
    if (!isPending && !viewer) {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [isPending, viewer, router, pathname])

  // Still checking the session — show the auth loader, not the workspace one.
  if (isPending) return <AuthLoader />

  // Not signed in — the effect above will redirect; render nothing while that happens.
  if (!viewer) return null

  // Signed in but wrong role — show fallback (or nothing).
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(viewer.role)) return <>{fallback}</>
  }

  return <>{children}</>
}
