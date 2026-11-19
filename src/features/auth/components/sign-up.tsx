"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useSignUp, useSendOtp, useViewer } from "@/features/auth/session"
import { notify } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Logo } from "@/components/shared/logo"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

/**
 * Sign up for Your Galley: name (optional), email, password, and password confirmation.
 * The form on the left; on wide screens, a deploy in progress on the right.
 */
export function SignUp() {
  const router = useRouter()
  const viewer = useViewer()
  const signUp = useSignUp()
  const sendOtp = useSendOtp()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [revealed, setRevealed] = React.useState(false)
  const [confirmRevealed, setConfirmRevealed] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [awaitingVerification, setAwaitingVerification] = React.useState(false)

  // A newly created account has a session before its email is verified. Do not let that
  // session send the user to the dashboard while the verification handoff is in progress.
  React.useEffect(() => {
    if (viewer.data && !awaitingVerification) router.replace("/dashboard")
  }, [awaitingVerification, viewer.data, router])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFieldError(null)

    if (password !== confirmPassword) {
      return setFieldError("Passwords do not match. Please re-enter your password.")
    }

    if (password.length < 10) {
      return setFieldError("Password must be at least 10 characters long.")
    }

    setAwaitingVerification(true)
    signUp.mutate(
      { email: email.trim(), password, name: name.trim() },
      {
        onSuccess: () => {
          // Account created — send a verification code and go to the OTP page.
          sendOtp.mutate({ email: email.trim() }, { onSuccess: () => router.replace(`/verify-email?email=${encodeURIComponent(email.trim())}`) })
        },
        onError: (caught) => {
          setAwaitingVerification(false)
          notify.error(caught, { title: "Unable to create account" })
        },
      }
    )
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
            <h1 className="text-3xl font-medium tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start deploying with Your Galley — your projects, deploys and logs.</p>
          </div>

          <form onSubmit={submit} noValidate className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="signup-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                placeholder="Your name"
                className="h-10"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                placeholder="you@company.com"
                className="h-10"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <InputGroup className="h-10">
                <InputGroupInput
                  id="signup-password"
                  type={revealed ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={10}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
                    <Icon name={revealed ? "eye-off" : "eye"} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="signup-confirm" className="text-sm font-medium">
                Confirm password
              </label>
              <InputGroup className="h-10">
                <InputGroupInput
                  id="signup-confirm"
                  type={confirmRevealed ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={10}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label={confirmRevealed ? "Hide password" : "Show password"} aria-pressed={confirmRevealed} onClick={() => setConfirmRevealed((r) => !r)}>
                    <Icon name={confirmRevealed ? "eye-off" : "eye"} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            {fieldError && (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-[0.8125rem] leading-snug text-destructive">
                <Icon name="circle-alert" size="xs" className="mt-0.5 shrink-0" /> {fieldError}
              </div>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" loading={signUp.isPending} disabled={!name.trim() || !email.trim() || !password || password !== confirmPassword}>
              Create account
            </Button>

            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/signin" className="text-foreground underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <footer className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Deplogram</span>
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </footer>
      </section>

      <DeployScene />
    </main>
  )
}

const steps = [
  { label: "Cloned ada-obi/orders-api", meta: "0.8s" },
  { label: "Detected Node 22", meta: "0.1s" },
  { label: "Installed dependencies", meta: "6.2s" },
  { label: "Built", meta: "14.9s" },
]

/** The right half: one deploy, nearly done, on the brand wash. Always dark, whatever the theme. Decorative. */
function DeployScene() {
  return (
    <aside aria-hidden className="dark relative m-3 hidden overflow-hidden rounded-2xl text-foreground lg:grid lg:place-items-center">
      <div className="absolute inset-0 bg-[url(/images/gradient-ember.webp)] bg-cover bg-center" />
      <div className="absolute inset-0 bg-dot-grid opacity-40 mask-fade-edges" />
      <div className="relative grid w-[min(28rem,80%)] gap-5">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <StatusDot tone="progress" motion="progress" size="sm" />
            <span className="font-mono text-xs">orders-api</span>
            <span className="font-mono text-xs text-muted-foreground">main · 72c32b8</span>
            <span className="ml-auto font-mono text-[0.6875rem] tracking-wider text-muted-foreground uppercase">Starting</span>
          </div>
          <ol className="grid gap-0.5 p-2 font-mono text-[0.8125rem]">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 rounded-md px-2.5 py-2 text-foreground/80 odd:bg-muted/40">
                <Icon name="check" size="xs" className="text-brand-ink" />
                {s.label}
                <span className="ml-auto text-[0.6875rem] text-muted-foreground">{s.meta}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 px-2.5 py-2">
              <Icon name="loader" size="xs" className="animate-spin text-muted-foreground motion-reduce:animate-none" />
              Health check on :8080
            </li>
          </ol>
        </div>
        <p className="text-center text-sm font-medium text-foreground/90">Push to main. Live in about a minute.</p>
      </div>
    </aside>
  )
}
