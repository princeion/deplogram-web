"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { canVerifyWithSecret, decodeJwt, verifyHmac } from "@/features/utilities/lib/codecs"
import { CodeEditor } from "@/components/code-editor/code-editor"
import { Icon } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeArea, CopyButton, Pane, StatusLine } from "@/features/utilities/components/utility-shell"

// A sample signed with the secret "deplogram-secret", expiring far in the future.
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMTA0MiIsIm5hbWUiOiJBZGEgT2JpIiwicm9sZSI6Im93bmVyIiwiaXNzIjoiaHR0cHM6Ly9hcGkuZGVwbG9ncmFtLmNvbSIsImF1ZCI6ImdhbGxleSIsImlhdCI6MTc2MDAwMDAwMCwiZXhwIjoxOTI0OTkyMDAwfQ.rvPTDhB42TOWsehz0amb0NyJay5uH_FqvYKTDX2575E"

const CLAIMS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires",
  nbf: "Not before",
  iat: "Issued",
  jti: "Token ID",
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" })
const fromUnix = (value: unknown) => (typeof value === "number" ? new Date(value * 1000) : null)

/** Paste a JWT: its parts coloured, header and payload decoded, the claims explained, expiry checked. */
export function JwtDecoder() {
  const [token, setToken] = React.useState(SAMPLE)
  const [secret, setSecret] = React.useState("")
  const [verdict, setVerdict] = React.useState<{ ok: boolean; message: string } | null>(null)

  const decoded = React.useMemo(() => {
    if (!token.trim()) return { state: "idle" as const }
    try {
      return { state: "ok" as const, ...decodeJwt(token) }
    } catch (error) {
      return { state: "error" as const, message: error instanceof Error ? error.message : "Not a JWT" }
    }
  }, [token])
  React.useEffect(() => setVerdict(null), [token, secret])

  const now = Date.now()
  const exp = decoded.state === "ok" ? fromUnix(decoded.payload.exp) : null
  const nbf = decoded.state === "ok" ? fromUnix(decoded.payload.nbf) : null
  const expired = exp != null && exp.getTime() < now
  const notYet = nbf != null && nbf.getTime() > now

  const verify = async () => {
    if (decoded.state !== "ok") return
    try {
      const ok = await verifyHmac(decoded, secret)
      setVerdict({ ok, message: ok ? "Signature is valid for this secret." : "Signature doesn't match this secret." })
    } catch (error) {
      setVerdict({ ok: false, message: error instanceof Error ? error.message : "Couldn't check the signature." })
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setToken(SAMPLE)
            setSecret("deplogram-secret")
          }}
        >
          <Icon name="sparkles" /> Sample
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setToken("")}>
          <Icon name="x" /> Clear
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          <Pane title="Token" icon="key-round" actions={<CopyButton value={token} />}>
            <CodeArea value={token} onChange={setToken} label="JWT" placeholder="eyJhbGciOi…" className="min-h-32 break-all" />
          </Pane>
          {decoded.state === "ok" && (
            <Pane title="Parts" icon="layers">
              <p className="px-3.5 py-3 font-mono text-[0.8125rem] leading-relaxed break-all">
                <span className="text-brand-ink">{decoded.parts[0]}</span>.<span className="text-foreground">{decoded.parts[1]}</span>.<span className="text-success">{decoded.parts[2]}</span>
              </p>
              <p className="flex flex-wrap gap-4 border-t border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand" /> Header
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-foreground" /> Payload
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" /> Signature
                </span>
              </p>
            </Pane>
          )}
          {decoded.state === "ok" && (
            <Pane title="Check the signature" icon="shield">
              <div className="grid gap-2 p-3.5">
                {canVerifyWithSecret(decoded.header.alg) ? (
                  <>
                    <div className="flex gap-2">
                      <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="The shared secret" aria-label="Secret" className="font-mono" type="password" autoComplete="off" />
                      <Button variant="outline" onClick={() => void verify()} disabled={!secret}>
                        Check
                      </Button>
                    </div>
                    {verdict && (
                      <p className={cn("flex items-center gap-1.5 text-sm", verdict.ok ? "text-success" : "text-destructive")}>
                        <Icon name={verdict.ok ? "check" : "circle-x"} size="xs" /> {verdict.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">The secret stays in this tab.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This token uses <span className="font-mono text-foreground">{String(decoded.header.alg ?? "an unknown algorithm")}</span>, which is checked with a public key, not a secret.
                  </p>
                )}
              </div>
            </Pane>
          )}
        </div>

        <div className="grid content-start gap-3">
          {decoded.state === "ok" ? (
            <>
              <Pane title="Claims" icon="file-text">
                <dl className="divide-y divide-border/50">
                  {Object.entries(decoded.payload).map(([key, value]) => {
                    const date = ["exp", "nbf", "iat"].includes(key) ? fromUnix(value) : null
                    return (
                      <div key={key} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-3.5 py-2 text-sm">
                        <dt className="truncate text-muted-foreground">
                          <span className="font-mono text-foreground/85">{key}</span>
                          {CLAIMS[key] && <span className="block text-xs">{CLAIMS[key]}</span>}
                        </dt>
                        <dd className="min-w-0 font-mono text-[0.8125rem] break-all">
                          {date ? (
                            <>
                              {dateFormat.format(date)}
                              <span className="block font-sans text-xs text-muted-foreground">{formatRelativeTime(date.toISOString())}</span>
                            </>
                          ) : typeof value === "string" ? (
                            value
                          ) : (
                            JSON.stringify(value)
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </Pane>
              <Pane title="Header" icon="braces" bodyClassName="h-32">
                <CodeEditor modelPath="utilities/jwt-header.json" filePath="header.json" value={JSON.stringify(decoded.header, null, 2)} onChange={() => {}} readOnly minimal />
              </Pane>
            </>
          ) : (
            <div className="grid min-h-60 place-items-center rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
              The decoded token appears here.
            </div>
          )}
        </div>
      </div>

      {decoded.state === "idle" && <StatusLine tone="idle">Paste a token on the left.</StatusLine>}
      {decoded.state === "error" && <StatusLine tone="error">{decoded.message}</StatusLine>}
      {decoded.state === "ok" &&
        (expired ? (
          <StatusLine tone="error">Expired {formatRelativeTime(exp!.toISOString())} — {dateFormat.format(exp!)}</StatusLine>
        ) : notYet ? (
          <StatusLine tone="warn">Not valid until {dateFormat.format(nbf!)}</StatusLine>
        ) : (
          <StatusLine tone="ok">
            Decoded · {String(decoded.header.alg ?? "no algorithm")}
            {exp ? ` · valid until ${dateFormat.format(exp)}` : " · no expiry"}
            <span className="text-muted-foreground">Decoding doesn&apos;t check the signature — use the check on the left.</span>
          </StatusLine>
        ))}
    </div>
  )
}
