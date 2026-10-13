"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function SignOutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <p className="mb-4">Signed out successfully.</p>
        <Button onClick={() => {
          signOut({ redirect: false })
          router.push("/")
        }}>Continue to deplogram</Button>
      </div>
    </div>
  )
}