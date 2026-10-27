"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useSignOut, useViewer } from "@/features/auth/session"
import { notify } from "@/components/feedback"
import { Logo } from "@/components/shared/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/** Sign out, said plainly: who you are, and the two ways out of here. */
export function SignOut() {
  const router = useRouter()
  const viewer = useViewer()
  const signOut = useSignOut()

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5">
      <div className="grid w-full max-w-sm gap-6">
        <Logo />
        <div className="surface-raised grid gap-5 rounded-xl p-5">
          <div className="grid gap-1">
            <h1 className="text-xl font-medium tracking-tight">Sign out?</h1>
            {viewer.isPending ? (
              <Skeleton className="h-4 w-48" />
            ) : viewer.data ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re signed in as <span className="font-mono text-foreground">{viewer.data.email}</span>. Your projects keep running.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">You&apos;re already signed out.</p>
            )}
          </div>
          {viewer.data ? (
            <div className="flex flex-wrap gap-2">
              <Button
                loading={signOut.isPending}
                onClick={() =>
                  signOut.mutate(undefined, {
                    onSuccess: () => router.replace("/"),
                    onError: (error) => notify.error(error, { title: "Couldn't sign you out" }),
                  })
                }
              >
                Sign out
              </Button>
              <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
                Back to Your Galley
              </Link>
            </div>
          ) : (
            !viewer.isPending && (
              <Link href="/signin" className={buttonVariants({ className: "w-fit" })}>
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </main>
  )
}
