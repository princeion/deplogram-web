"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") return null

  if (session) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          signOut({ redirect: false })
        }}
      >
        Sign out
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => {}}
      className="hidden"
    />
  )
}