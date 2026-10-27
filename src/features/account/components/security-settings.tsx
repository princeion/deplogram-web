"use client"

import * as React from "react"
import QRCode from "qrcode"

import { formatRelativeTime } from "@/lib/format"
import {
  passwordFormSchema,
  useChangePassword,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useEndOtherSessions,
  useEndSession,
  useNewRecoveryCodes,
  useSecurity,
  useSessions,
  useStartTwoFactor,
  type Session,
} from "@/features/account/security"
import { Form, FormRootError, SecretField, useZodForm } from "@/components/forms"
import { errorMessage, notify, useConfirm } from "@/components/feedback"
import { CopyButton } from "@/components/shared/copy-button"
import { Icon } from "@/components/shared/icon"
import { SettingRow, SettingsTable } from "@/components/shared/settings-table"
import { StatusDot } from "@/components/shared/status-dot"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/app-shell/error-state"
import { PageSection } from "@/components/app-shell/page"

/** Settings › Security: how you sign in, and where you're signed in. */
export function SecuritySettings() {
  return (
    <>
      <SignInSection />
      <SessionsSection />
    </>
  )
}

// ── Password and two-factor ─────────────────────────────────────────────────────

function SignInSection() {
  const { data, isPending, isError, refetch } = useSecurity()
  const [dialog, setDialog] = React.useState<"password" | "setup" | "disable" | null>(null)
  const [codes, setCodes] = React.useState<string[] | null>(null)
  const regenerate = useNewRecoveryCodes()
  const confirm = useConfirm()

  return (
    <PageSection title="Signing in" description="Your password, and a second step so a stolen password isn't enough.">
      {isPending ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : isError ? (
        <ErrorState size="compact" title="Security settings didn't load." onRetry={() => refetch()} />
      ) : (
        <SettingsTable>
          <SettingRow
            label="Password"
            aside={
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setDialog("password")}>
                Change
              </Button>
            }
          >
            <span className="px-2 text-sm">
              <span className="font-mono tracking-widest text-muted-foreground">••••••••••</span>
              <span className="ml-3 text-muted-foreground">{data.passwordChangedAt ? `Changed ${formatRelativeTime(data.passwordChangedAt)}` : "Not set"}</span>
            </span>
          </SettingRow>
          <SettingRow
            label="Two-factor"
            aside={
              data.twoFactor.enabled ? (
                <span className="ml-auto flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={regenerate.isPending}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Make new recovery codes?",
                        description: "Your current recovery codes stop working. Save the new ones somewhere safe.",
                        confirmLabel: "Make new codes",
                      })
                      if (!ok) return
                      regenerate.mutate(undefined, {
                        onSuccess: (r) => setCodes(r.recoveryCodes),
                        onError: (error) => notify.error(error, { title: "Couldn't make new codes" }),
                      })
                    }}
                  >
                    New recovery codes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("disable")}>
                    Turn off
                  </Button>
                </span>
              ) : (
                <Button size="sm" className="ml-auto" onClick={() => setDialog("setup")}>
                  Turn on
                </Button>
              )
            }
          >
            <span className="flex min-w-0 items-center gap-2 px-2 text-sm">
              <StatusDot tone={data.twoFactor.enabled ? "success" : "muted"} size="sm" />
              {data.twoFactor.enabled ? (
                <span className="truncate">
                  On · authenticator app
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{data.twoFactor.recoveryCodesLeft} recovery codes left</span>
                </span>
              ) : (
                <span className="truncate text-muted-foreground">Off — your password alone gets someone in.</span>
              )}
            </span>
          </SettingRow>
        </SettingsTable>
      )}

      <ChangePasswordDialog open={dialog === "password"} onClose={() => setDialog(null)} />
      <TwoFactorSetupDialog open={dialog === "setup"} onClose={() => setDialog(null)} />
      <DisableTwoFactorDialog open={dialog === "disable"} onClose={() => setDialog(null)} />
      <Dialog open={codes !== null} onOpenChange={(open) => !open && setCodes(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your new recovery codes</DialogTitle>
            <DialogDescription>Each works once, if you lose your phone. The old codes no longer work.</DialogDescription>
          </DialogHeader>
          {codes && <RecoveryCodes codes={codes} />}
          <DialogFooter>
            <Button onClick={() => setCodes(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = useZodForm(passwordFormSchema, { defaultValues: { current: "", next: "", confirm: "" } })
  const change = useChangePassword()
  const close = () => {
    onClose()
    window.setTimeout(() => form.reset(), 200)
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>Other devices stay signed in. Sign them out below if you think someone else knows the old one.</DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          className="gap-4"
          onSubmit={async (values) => {
            await change.mutateAsync(values)
            notify.success("Password changed")
            close()
          }}
        >
          <SecretField control={form.control} name="current" label="Current password" autoComplete="current-password" copyable={false} required />
          <SecretField control={form.control} name="next" label="New password" description="At least 10 characters. A few unrelated words work well." autoComplete="new-password" copyable={false} required />
          <SecretField control={form.control} name="confirm" label="New password, again" autoComplete="new-password" copyable={false} required />
          <FormRootError />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Change password
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/** Scan, confirm with a code, then save the recovery codes — two steps in one dialog. */
function TwoFactorSetupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const start = useStartTwoFactor()
  const enable = useEnableTwoFactor()
  const [qr, setQr] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [codes, setCodes] = React.useState<string[] | null>(null)
  const [saved, setSaved] = React.useState(false)

  // A fresh secret each time the dialog opens.
  const { mutate: begin, reset: resetStart } = start
  React.useEffect(() => {
    if (!open) return
    begin(undefined, {
      onSuccess: async (setup) => setQr(await QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 360, color: { dark: "#111111", light: "#ffffff" } })),
    })
  }, [open, begin])

  const close = () => {
    onClose()
    window.setTimeout(() => {
      resetStart()
      setQr(null)
      setCode("")
      setError(null)
      setCodes(null)
      setSaved(false)
    }, 200)
  }

  const verify = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    enable.mutate(code, { onSuccess: (r) => setCodes(r.recoveryCodes), onError: (e) => setError(errorMessage(e)) })
  }

  const secret = start.data?.secret ?? ""

  return (
    <Dialog open={open} onOpenChange={(next) => !next && (codes ? saved && close() : close())}>
      <DialogContent className="sm:max-w-md">
        {codes ? (
          <>
            <DialogHeader>
              <DialogTitle>Two-factor is on. Save your recovery codes.</DialogTitle>
              <DialogDescription>If you lose your phone, each of these gets you in once. We can&apos;t show them again.</DialogDescription>
            </DialogHeader>
            <RecoveryCodes codes={codes} />
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={saved} onCheckedChange={(checked) => setSaved(checked === true)} /> I&apos;ve saved them somewhere safe
            </label>
            <DialogFooter>
              <Button
                disabled={!saved}
                onClick={() => {
                  notify.success("Two-factor authentication is on")
                  close()
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={verify} className="grid grid-cols-[minmax(0,1fr)] gap-4">
            <DialogHeader>
              <DialogTitle>Turn on two-factor</DialogTitle>
              <DialogDescription>Scan this with an authenticator app — Google Authenticator, 1Password, Authy — then type the code it shows.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="mx-auto grid size-44 place-items-center rounded-xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL */}
                {qr ? <img src={qr} alt="QR code for your authenticator app" className="size-full" /> : <Skeleton className="size-full rounded-lg bg-black/10" />}
              </div>
              <div className="surface-sunken flex min-w-0 items-center gap-2 rounded-lg py-1 pr-1 pl-3">
                <span className="shrink-0 text-xs text-muted-foreground">Can&apos;t scan?</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{secret.replace(/(.{4})/g, "$1 ").trim() || "…"}</code>
                <CopyButton value={secret} label="Copy key" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="totp-code" className="text-sm font-medium">
                Code from the app
              </label>
              <Input
                id="totp-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="max-w-40 font-mono text-base tracking-[0.35em]"
                aria-invalid={error ? true : undefined}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={enable.isPending} disabled={code.length !== 6 || !secret}>
                Turn on
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DisableTwoFactorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const disable = useDisableTwoFactor()
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const close = () => {
    onClose()
    window.setTimeout(() => {
      setCode("")
      setError(null)
    }, 200)
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            disable.mutate(code.trim(), {
              onSuccess: () => {
                notify.success("Two-factor authentication is off")
                close()
              },
              onError: (e) => setError(errorMessage(e)),
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>Turn off two-factor?</DialogTitle>
            <DialogDescription>Your password alone will get someone into your account. Confirm with a code from your app, or a recovery code.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label htmlFor="disable-code" className="text-sm font-medium">
              Code
            </label>
            <Input id="disable-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" className="max-w-56 font-mono" aria-invalid={error ? true : undefined} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Keep it on
            </Button>
            <Button type="submit" variant="danger" loading={disable.isPending} disabled={code.trim().length < 6}>
              Turn off
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  const text = codes.join("\n")
  const download = () => {
    const url = URL.createObjectURL(new Blob([`Deplogram recovery codes\nEach works once.\n\n${text}\n`], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "deplogram-recovery-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="grid gap-2">
      <ol className="surface-sunken grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg px-4 py-3 font-mono text-sm">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <div className="flex gap-1">
        <CopyButton value={text} label="Copy all" />
        <Button variant="ghost" size="xs" onClick={download}>
          <Icon name="download" /> Download .txt
        </Button>
      </div>
    </div>
  )
}

// ── Sessions ────────────────────────────────────────────────────────────────────

function SessionsSection() {
  const { data, isPending, isError, refetch } = useSessions()
  const endOthers = useEndOtherSessions()
  const confirm = useConfirm()
  const others = data?.items.filter((s) => !s.current).length ?? 0

  return (
    <PageSection
      title="Where you're signed in"
      description="Sign out anything you don't recognise, then change your password."
      actions={
        others > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void confirm({
                title: `Sign out ${others} other ${others === 1 ? "device" : "devices"}?`,
                description: "Everywhere except this browser. They'll need your password to get back in.",
                confirmLabel: "Sign them out",
                action: async () => {
                  await endOthers.mutateAsync()
                  notify.success("Signed out everywhere else")
                },
              })
            }
          >
            <Icon name="logout" /> Sign out all others
          </Button>
        )
      }
    >
      {isPending ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : isError ? (
        <ErrorState size="compact" title="Sessions didn't load." onRetry={() => refetch()} />
      ) : (
        <ul className="surface-raised divide-y divide-border/50 overflow-hidden rounded-xl">
          {data.items.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      )}
    </PageSection>
  )
}

function SessionRow({ session }: { session: Session }) {
  const end = useEndSession()
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="surface-band grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground">
        <Icon name={session.device === "mobile" ? "smartphone" : "monitor"} size="sm" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="flex items-center gap-2 text-sm">
          <span className="truncate font-medium">
            {session.browser} on {session.os}
          </span>
          {session.current && <span className="shrink-0 rounded-full border border-success/40 px-1.5 text-[0.625rem] font-medium text-success">This device</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {session.location ?? "Unknown location"} · <span className="font-mono">{session.ip}</span> ·{" "}
          {session.current ? "active now" : `last active ${formatRelativeTime(session.lastActiveAt)}`}
        </p>
      </div>
      {!session.current && (
        <Button
          variant="ghost"
          size="sm"
          loading={end.isPending}
          onClick={() =>
            end.mutate(session.id, {
              onSuccess: () => notify.success(`Signed out ${session.browser} on ${session.os}`),
              onError: (error) => notify.error(error, { title: "Couldn't sign it out" }),
            })
          }
        >
          Sign out
        </Button>
      )}
    </li>
  )
}
