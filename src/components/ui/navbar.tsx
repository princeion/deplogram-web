"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NavBar() {
  const { data: session } = useSession()

  return (
    <nav className="flex items-center justify-between rounded-elevation-surface bg-card p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Home"
          className="p-1.5 rounded-md hover:bg-muted"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
          </svg>
        </Button>
        <span className="text-foreground font-medium">Deplogram</span>
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut({ redirect: false })
              }}
            >
              Sign out
            </Button>
          </>
        ) : null}
      </div>
    </nav>
  )
}