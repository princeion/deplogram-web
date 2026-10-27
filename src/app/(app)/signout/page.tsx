"use client"

import { useRouter } from "next/navigation"

import { useSignOut } from "@/features/auth/session"
import { Button } from "@/components/ui/button"

// TODO (authentication task): design this page.
export default function SignOutPage() {
  const router = useRouter()
  const signOut = useSignOut()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md text-center">
        <p className="mb-4">Sign out of Deplogram?</p>
        <Button disabled={signOut.isPending} onClick={() => signOut.mutate(undefined, { onSuccess: () => router.push("/") })}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
