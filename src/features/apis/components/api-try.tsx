"use client"

import * as React from "react"

import { formatBytes } from "@/lib/format"
import { useViewer } from "@/features/auth/session"
import type { TryRequest } from "@/features/apis/apis"
import { ApiWorkbench, TryField } from "@/features/apis/components/api-workbench"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const asRecord = (body: unknown) => (body && typeof body === "object" ? (body as Record<string, unknown>) : {})

// ── OTP ─────────────────────────────────────────────────────────────────────────

export function OtpTry() {
  const [step, setStep] = React.useState<"send" | "verify">("send")
  const [channel, setChannel] = React.useState<"sms" | "whatsapp" | "email">("sms")
  const [to, setTo] = React.useState("+2348012345678")
  const [length, setLength] = React.useState<"4" | "6" | "8">("6")
  const [otpId, setOtpId] = React.useState("")
  const [code, setCode] = React.useState("")

  const request: TryRequest =
    step === "send"
      ? { method: "POST", path: "/v1/otp/send", body: { to, channel, length: Number(length), expires_in: 300 } }
      : { method: "POST", path: "/v1/otp/verify", body: { id: otpId, code } }

  const pickChannel = (next: typeof channel) => {
    setChannel(next)
    // Keep the address sensible for the channel.
    if (next === "email" && !to.includes("@")) setTo("ada@example.com")
    if (next !== "email" && to.includes("@")) setTo("+2348012345678")
  }

  return (
    <ApiWorkbench
      api="otp"
      request={request}
      canSend={step === "send" ? to.trim().length > 4 : otpId.length > 0 && code.length > 0}
      note={
        <>
          Test keys don&apos;t deliver anything — the code is always <span className="font-mono text-foreground">{"0".repeat(Number(length))}</span>.
        </>
      }
      tabs={
        <Segmented
          label="Endpoint"
          size="sm"
          value={step}
          onChange={setStep}
          options={[
            { value: "send", label: "Send a code" },
            { value: "verify", label: "Verify it" },
          ]}
        />
      }
      onResult={(result, sent) => {
        const body = asRecord(result.body)
        if (sent.path === "/v1/otp/send" && result.status < 400 && typeof body.id === "string") {
          setOtpId(body.id)
          setCode("")
          setStep("verify")
        }
      }}
    >
      {step === "send" ? (
        <>
          <TryField label="Channel">
            <Segmented
              label="Channel"
              size="sm"
              value={channel}
              onChange={pickChannel}
              options={[
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "email", label: "Email" },
              ]}
            />
          </TryField>
          <TryField label={channel === "email" ? "Email" : "Phone"} htmlFor="otp-to" hint={channel === "email" ? undefined : "With the country code, e.g. +234…"}>
            <Input id="otp-to" value={to} onChange={(e) => setTo(e.target.value)} className="font-mono" inputMode={channel === "email" ? "email" : "tel"} spellCheck={false} />
          </TryField>
          <TryField label="Digits">
            <Segmented
              label="Digits"
              size="sm"
              value={length}
              onChange={setLength}
              options={[
                { value: "4", label: "4" },
                { value: "6", label: "6" },
                { value: "8", label: "8" },
              ]}
            />
          </TryField>
        </>
      ) : (
        <>
          <TryField label="Code ID" htmlFor="otp-id" hint={otpId ? "From the code you just sent." : "Send a code first — its ID comes back in the response."}>
            <Input id="otp-id" value={otpId} onChange={(e) => setOtpId(e.target.value)} className="font-mono" spellCheck={false} placeholder="otp_…" />
          </TryField>
          <TryField label="Code" htmlFor="otp-code" hint="Try a wrong one too.">
            <Input
              id="otp-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="max-w-40 font-mono tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
            />
          </TryField>
        </>
      )}
    </ApiWorkbench>
  )
}

// ── Email ───────────────────────────────────────────────────────────────────────

export function EmailTry() {
  const viewer = useViewer()
  const own = viewer.data?.email ?? ""
  const [to, setTo] = React.useState<string | null>(null)
  const [subject, setSubject] = React.useState("Your order #1042 is confirmed")
  const [text, setText] = React.useState("Hi Ada,\n\nThanks for your order. We'll email you again when it ships.\n\n— The Orders team")
  const recipient = to ?? own

  const request: TryRequest = { method: "POST", path: "/v1/email/send", body: { from: "Orders <orders@mail.dpl.app>", to: recipient, subject, text } }

  return (
    <ApiWorkbench
      api="email"
      request={request}
      canSend={recipient.includes("@") && subject.trim().length > 0}
      note="Test keys only send to your own address, so you can see it arrive."
      preview={(body) => (
        <div className="grid gap-2 p-3.5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="check" size="xs" className="text-success" /> Queued — {String(asRecord(body).to ?? recipient)} gets this in a few seconds.
          </p>
          <div className="surface-sunken grid gap-1 rounded-lg p-3 text-sm">
            <p className="font-medium">{subject}</p>
            <p className="text-xs text-muted-foreground">From Orders &lt;orders@mail.dpl.app&gt;</p>
            <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-muted-foreground">{text}</p>
          </div>
        </div>
      )}
    >
      <TryField label="To" htmlFor="email-to" hint={own && recipient !== own ? "Test keys only send to your own address." : undefined}>
        <Input id="email-to" value={recipient} onChange={(e) => setTo(e.target.value)} className="font-mono" inputMode="email" spellCheck={false} />
      </TryField>
      <TryField label="Subject" htmlFor="email-subject">
        <Input id="email-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </TryField>
      <TryField label="Message" htmlFor="email-text" hint="Plain text here; the API also takes html and a template with data.">
        <Textarea id="email-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} className="resize-none" />
      </TryField>
    </ApiWorkbench>
  )
}

// ── Image transform ─────────────────────────────────────────────────────────────

const imageSources = [
  { value: "storage://assets/images/product-shot.png", label: "product-shot.png" },
  { value: "storage://assets/images/team-offsite.jpg", label: "team-offsite.jpg" },
  { value: "storage://assets/images/og-image.png", label: "og-image.png" },
] as const

export function ImageTry() {
  const [source, setSource] = React.useState<string>(imageSources[0].value)
  const [width, setWidth] = React.useState("640")
  const [height, setHeight] = React.useState("")
  const [fit, setFit] = React.useState<"cover" | "contain" | "inside">("inside")
  const [format, setFormat] = React.useState<"webp" | "avif" | "jpeg" | "png">("webp")
  const [quality, setQuality] = React.useState("80")

  const number = (value: string) => (value.trim() ? Number(value) : undefined)
  const request: TryRequest = {
    method: "POST",
    path: "/v1/images/transform",
    body: { source, width: number(width), height: number(height), fit, format, ...(format !== "png" && { quality: number(quality) ?? 80 }) },
  }

  return (
    <ApiWorkbench
      api="images"
      request={request}
      canSend={source.trim().length > 0 && Boolean(number(width) || number(height))}
      note="Sources can be a Storage path or any public https URL. Results are cached on the CDN."
      preview={(body) => {
        const r = asRecord(body)
        if (typeof r.url !== "string") return null
        return (
          <div className="grid gap-3 p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="surface-sunken grid place-items-center overflow-hidden rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a CDN URL from the API, sized by the response */}
              <img src={r.url} alt="The transformed image" className="max-h-48 w-auto rounded" />
            </div>
            <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 font-mono text-xs">
              <dt className="text-muted-foreground">size</dt>
              <dd>
                {String(r.width)}×{String(r.height)}
              </dd>
              <dt className="text-muted-foreground">format</dt>
              <dd>{String(r.format)}</dd>
              <dt className="text-muted-foreground">bytes</dt>
              <dd>
                {typeof r.source_bytes === "number" && <span className="text-muted-foreground">{formatBytes(r.source_bytes)} → </span>}
                {typeof r.bytes === "number" && formatBytes(r.bytes)}
              </dd>
            </dl>
          </div>
        )
      }}
    >
      <TryField label="Source" htmlFor="image-source">
        <Input id="image-source" value={source} onChange={(e) => setSource(e.target.value)} className="font-mono" spellCheck={false} />
        <div className="flex flex-wrap gap-1 pt-1">
          {imageSources.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSource(s.value)}
              aria-pressed={source === s.value}
              className="rounded-md border border-border/70 px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:border-brand/50 aria-pressed:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      </TryField>
      <TryField label="Size" hint="Leave one empty to keep the proportions.">
        <div className="flex items-center gap-2">
          <Input aria-label="Width" value={width} onChange={(e) => setWidth(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="width" className="w-24 font-mono" />
          <span className="text-muted-foreground">×</span>
          <Input aria-label="Height" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="auto" className="w-24 font-mono" />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </TryField>
      <TryField label="Fit">
        <Segmented
          label="Fit"
          size="sm"
          value={fit}
          onChange={setFit}
          options={[
            { value: "inside", label: "Inside" },
            { value: "cover", label: "Cover" },
            { value: "contain", label: "Contain" },
          ]}
        />
      </TryField>
      <TryField label="Format">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Format"
            size="sm"
            value={format}
            onChange={setFormat}
            options={[
              { value: "webp", label: "WebP" },
              { value: "avif", label: "AVIF" },
              { value: "jpeg", label: "JPEG" },
              { value: "png", label: "PNG" },
            ]}
          />
          {format !== "png" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Quality
              <Input aria-label="Quality" value={quality} onChange={(e) => setQuality(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className="h-8 w-16 font-mono" />
            </label>
          )}
        </div>
      </TryField>
    </ApiWorkbench>
  )
}

// ── QR codes ────────────────────────────────────────────────────────────────────

export function QrTry() {
  const [data, setData] = React.useState("https://orders-api.dpl.app/orders/1042")
  const [format, setFormat] = React.useState<"svg" | "png">("svg")
  const [size, setSize] = React.useState("320")
  const [level, setLevel] = React.useState<"L" | "M" | "Q" | "H">("M")
  const [dark, setDark] = React.useState("#111111")

  const request: TryRequest = { method: "POST", path: "/v1/qr", body: { data, format, size: Number(size) || 320, error_correction: level, color: dark, background: "#ffffff" } }

  return (
    <ApiWorkbench
      api="qr"
      request={request}
      canSend={data.length > 0 && data.length <= 2000}
      note="Higher error correction survives scuffs and logos, at the cost of a denser code."
      preview={(body) => {
        const r = asRecord(body)
        if (typeof r.url !== "string") return null
        return (
          <div className="flex flex-wrap items-center gap-4 p-3.5">
            <div className="rounded-lg bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- a CDN URL from the API */}
              <img src={r.url} alt={`QR code for ${data}`} className="size-36" />
            </div>
            <div className="grid gap-1 font-mono text-xs">
              <p>
                <span className="text-muted-foreground">format</span> {String(r.format)}
              </p>
              <p>
                <span className="text-muted-foreground">size</span> {String(r.size)}px
              </p>
              <a href={r.url} download={`qr.${String(r.format)}`} className="mt-1 inline-flex items-center gap-1.5 font-sans text-sm text-foreground underline-offset-2 hover:underline">
                <Icon name="download" size="xs" /> Download
              </a>
            </div>
          </div>
        )
      }}
    >
      <TryField label="Content" htmlFor="qr-data" hint={`${data.length} of 2,000 characters — a URL, text, or a payment string.`}>
        <Textarea id="qr-data" value={data} onChange={(e) => setData(e.target.value)} rows={2} className="resize-none font-mono" spellCheck={false} />
      </TryField>
      <TryField label="Format">
        <Segmented
          label="Format"
          size="sm"
          value={format}
          onChange={setFormat}
          options={[
            { value: "svg", label: "SVG" },
            { value: "png", label: "PNG" },
          ]}
        />
      </TryField>
      <TryField label="Size" htmlFor="qr-size">
        <div className="flex items-center gap-2">
          <Input id="qr-size" value={size} onChange={(e) => setSize(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" className="w-24 font-mono" />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </TryField>
      <TryField label="Error correction">
        <Segmented
          label="Error correction"
          size="sm"
          value={level}
          onChange={setLevel}
          options={[
            { value: "L", label: "L · 7%" },
            { value: "M", label: "M · 15%" },
            { value: "Q", label: "Q · 25%" },
            { value: "H", label: "H · 30%" },
          ]}
        />
      </TryField>
      <TryField label="Colour" htmlFor="qr-color">
        <div className="flex items-center gap-2">
          <input id="qr-color" type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="size-9 cursor-pointer rounded-md border border-border/70 bg-transparent p-1" />
          <span className="font-mono text-sm">{dark}</span>
          <span className="text-xs text-muted-foreground">on white — keep it dark enough to scan.</span>
        </div>
      </TryField>
    </ApiWorkbench>
  )
}
