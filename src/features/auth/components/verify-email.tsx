"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { useVerifyOtp, useViewer } from "@/features/auth/session"
import { errorMessage } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Verify the 6-digit code sent to the user's email after sign-up.
 * On success, redirects to the dashboard.
 */
export function VerifyEmail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const viewer = useViewer()
  const verifyOtp = useVerifyOtp()

  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  // Already signed in: go straight to dashboard.
  React.useEffect(() => {
    if (viewer.data) router.replace("/dashboard")
  }, [viewer.data, router])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email) {
      return setError("No email in session — please sign up again.")
    }

    if (!/^\d{6}$/.test(code)) {
      return setError("Enter the 6-digit code.")
    }

    verifyOtp.mutate(
      { email, code: code.trim() },
      {
        onSuccess: () => router.replace("/dashboard"),
        onError: (caught) => setError(errorMessage(caught)),
      }
    )
  }

  const resend = () => {
    // Trigger a resend via the sign-up page flow — the user can re-enter their email.
    router.replace("/signup")
  }

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col px-5 py-5 sm:px-10 sm:py-6">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            deplogram.com
          </Link>
        </header>

        <div className="mx-auto grid w-full max-w-sm flex-1 content-center gap-8 py-12">
          <div className="grid gap-1.5">
            <h1 className="text-3xl font-medium tracking-tight">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              A 6-digit code was sent to <span className="font-medium">{email}</span>. Enter it here to finish creating your account.
            </p>
          </div>

          <form onSubmit={submit} noValidate className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="verify-code" className="text-sm font-medium">
                Verification code
              </label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
                required
                placeholder="000000"
                className="h-11 max-w-48 font-mono text-lg tracking-[0.4em]"
              />
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <Icon name="circle-x" size="xs" className="mt-0.5" /> {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" loading={verifyOtp.isPending} disabled={code.length !== 6 || !email.trim()}>
              Verify code
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn't receive it?{" "}
              <button type="button" onClick={resend} className="text-foreground underline-offset-2 hover:underline">
                Sign up again
              </button>
            </p>
          </form>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-foreground underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
