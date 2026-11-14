"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useViewer } from "@/features/auth/session"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/shared/icon"

/**
 * "Join the space" CTA. Checks the session and routes:
 *  - Already signed in → dashboard
 *  - No session → sign-up (create an account)
 */
export function JoinSpace({ className }: { className?: string }) {
  const router = useRouter()
  const viewer = useViewer()

  function handleClick() {
    if (viewer.data) {
      // Account exists and a session is active — go straight to the workspace.
      router.replace("/dashboard")
    } else {
      // No account yet — create one.
      router.replace("/signup")
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="inverted"
      size="lg"
      className={className}
    >
      Join the space
      <Icon name="arrow-up-right" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Button>
  )
}
