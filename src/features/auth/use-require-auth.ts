"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

import { useViewer, type Viewer } from "@/features/auth/session"

/**
 * Returns the authenticated viewer, redirecting to sign-in if no session exists.
 *
 * While the session is loading `viewer` is `undefined`; once resolved it's either the
 * `Viewer` object or `null` (for the one render before the redirect fires). Callers should
 * treat `undefined` as "loading" and `null` as "redirecting".
 *
 * ```tsx
 * const { viewer, isPending } = useRequireAuth()
 * if (isPending || !viewer) return <PageSkeleton />
 * // From here, `viewer` is guaranteed non-null.
 * ```
 */
export function useRequireAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const query = useViewer()

  useEffect(() => {
    if (!query.isPending && !query.data) {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [query.isPending, query.data, router, pathname])

  return {
    /** The signed-in user — `undefined` while loading, `null` for the redirect render. */
    viewer: query.data as Viewer | undefined | null,
    /** `true` while the session is being fetched. */
    isPending: query.isPending,
  }
}
