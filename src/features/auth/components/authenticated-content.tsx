"use client"

import { RequireAuth } from "@/features/auth/components/require-auth"

/**
 * Client-side auth gate for the Galley dashboard. Wraps the page content inside the app shell
 * so the sidebar/header still render (they handle their own signed-out state), but the page
 * itself is only shown to authenticated users.
 */
export function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
