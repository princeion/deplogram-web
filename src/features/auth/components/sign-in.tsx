"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { signInRefusal, useSignIn, useViewer } from "@/features/auth/session"
import { errorMessage } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Logo } from "@/components/shared/logo"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

/** Only same-site paths, so ?callbackUrl can't send people elsewhere after signing in. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
}

/**
 * Sign in to Your Galley: email and password, then — with two-factor on — a code from the
 * authenticator app (or a recovery code). The form on the left; on wide screens, a deploy in
 * progress on the right, so the page says what's behind it.
 */
export function SignIn() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get("callbackUrl"))
  const viewer = useViewer()
  const signIn = useSignIn()

  const [step, setStep] = React.useState<"password" | "code">("password")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [revealed, setRevealed] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [recovery, setRecovery] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Already signed in (a bookmarked /signin): go straight on.
  React.useEffect(() => {
    if (viewer.data) router.replace(next)
  }, [viewer.data, next, router])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    signIn.mutate(
      { email: email.trim(), password, ...(step === "code" && { code: code.trim() }) },
      {
        onSuccess: () => router.replace(next),
        onError: (caught) => {
          const refusal = signInRefusal(caught)
          if (refusal === "two_factor_required") return setStep("code")
          if (refusal === "invalid_code") return setError(recovery ? "That recovery code didn't work — it may have been used." : "That code didn't match. Try the newest one in your app.")
          if (refusal === "invalid_credentials") return setError("That email and password don't match an account.")
          setError(errorMessage(caught))
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
          {step === "password" ? (
            <div className="grid gap-1.5">
              <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">To Your Galley — your projects, deploys and logs.</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <h1 className="text-3xl font-medium tracking-tight">One more step</h1>
              <p className="text-sm text-muted-foreground">
                {recovery ? "Enter one of the recovery codes you saved." : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>
          )}

          <form onSubmit={submit} noValidate className="grid gap-4">
            {step === "password" ? (
              <>
                <div className="grid gap-1.5">
                  <label htmlFor="signin-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="signin-email"
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
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="signin-password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link href="/contact?topic=account" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      Forgot it?
                    </Link>
                  </div>
                  <InputGroup className="h-10">
                    <InputGroupInput
                      id="signin-password"
                      type={revealed ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton size="icon-xs" aria-label={revealed ? "Hide password" : "Show password"} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
                        <Icon name={revealed ? "eye-off" : "eye"} />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </>
            ) : (
              <div className="grid gap-1.5">
                <label htmlFor="signin-code" className="text-sm font-medium">
                  {recovery ? "Recovery code" : "Code"}
                </label>
                <Input
                  key={recovery ? "recovery" : "totp"}
                  id="signin-code"
                  value={code}
                  onChange={(e) => setCode(recovery ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode={recovery ? "text" : "numeric"}
                  autoFocus
                  placeholder={recovery ? "xxxxx-xxxx" : "000000"}
                  className={recovery ? "h-10 font-mono" : "h-11 max-w-48 font-mono text-lg tracking-[0.4em]"}
                />
                <button
                  type="button"
                  onClick={() => {
                    setRecovery((r) => !r)
                    setCode("")
                    setError(null)
                  }}
                  className="w-fit text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {recovery ? "Use your authenticator app" : "Lost your phone? Use a recovery code"}
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <Icon name="circle-x" size="xs" className="mt-0.5" /> {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full"
              loading={signIn.isPending}
              disabled={step === "password" ? !email.trim() || !password : recovery ? code.trim().length < 8 : code.length !== 6}
            >
              {step === "password" ? "Sign in" : "Verify"}
            </Button>

            {step === "code" && (
              <button
                type="button"
                onClick={() => {
                  setStep("password")
                  setCode("")
                  setRecovery(false)
                  setError(null)
                }}
                className="justify-self-center text-sm text-muted-foreground hover:text-foreground"
              >
                <Icon name="arrow-left" size="xs" className="mr-1 inline" />
                Use a different account
              </button>
            )}
          </form>

          {step === "password" && (
            <p className="text-sm text-muted-foreground">
              No account yet? Deplogram is in early access —{" "}
              <Link href="/waitlist" className="text-foreground underline-offset-2 hover:underline">
                join the waitlist
              </Link>
              .
            </p>
          )}
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
