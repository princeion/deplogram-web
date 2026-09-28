import type * as React from "react"

import { cn } from "@/lib/utils"
import type { IconName } from "@/content/types"
import { Icon } from "@/components/shared/icon"
import { NodeDot } from "@/components/shared/node-graph"

// TODO: illustrative mini-UIs for the API bento — swap for real product captures once the dashboard exists.
// Decorative only: the bento cell renders them inside an aria-hidden wrapper.

/** Row inside a visual: control-level chip. Shared by every visual below. */
const row = "flex items-center gap-3 rounded-lg elevation-control px-3 py-2.5 text-xs"

function OtpVisual() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 sm:gap-3">
        {"482916".split("").map((digit, i) => (
          <span
            key={i}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl elevation-control font-mono text-lg text-foreground sm:size-12",
              i === 5 && "ring-brand-ink/60"
            )}
          >
            {digit}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
        <span>otp.send → +234 801 ••• 5678</span>
        <span className="inline-flex items-center gap-2 text-foreground">
          <NodeDot lit />
          verified
        </span>
      </div>
    </div>
  )
}

function SmsVisual() {
  return (
    <div className="w-full max-w-72 rounded-2xl elevation-control p-3">
      <div className="flex items-center justify-between px-1 pb-2 font-mono text-xs text-muted-foreground">
        <span>MYAPP</span>
        <span>now</span>
      </div>
      <p className="rounded-2xl rounded-bl-md bg-background px-3.5 py-2.5 text-sm">Your order #1042 is on its way.</p>
      <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <Icon name="check" size="xs" className="text-brand-ink" />
        Delivered
      </p>
    </div>
  )
}

const notifications: readonly { icon: IconName; title: string; channel: string }[] = [
  { icon: "mail", title: "Your order has shipped", channel: "Email" },
  { icon: "smartphone", title: "Your order has shipped", channel: "SMS" },
]

/** One call fanning out to every channel. */
function NotificationsVisual() {
  return (
    <div className="flex w-full max-w-72 flex-col gap-2">
      <span className={cn(row, "w-fit font-mono text-muted-foreground")}>
        notify.send(<span className="text-brand-ink">&quot;order-shipped&quot;</span>)
      </span>
      <ul className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
        {notifications.map((item) => (
          <li key={item.channel} className={row}>
            <Icon name={item.icon} className="text-brand-ink" />
            <span className="min-w-0 flex-1 truncate text-foreground">{item.title}</span>
            <span className="shrink-0 text-muted-foreground">{item.channel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmailVisual() {
  return (
    <div className="overflow-hidden rounded-2xl elevation-control">
      <div className="flex flex-col gap-1 border-b border-border/70 px-4 py-3 font-mono text-xs text-muted-foreground">
        <span>from: hello@myapp.com</span>
        <span>to: ada@example.com</span>
        <span className="mt-1 font-sans text-sm font-medium text-foreground">Welcome to MyApp, Ada</span>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <span className="h-2 w-4/5 rounded-full bg-muted-foreground/20" />
        <span className="h-2 w-3/5 rounded-full bg-muted-foreground/20" />
        <span className="h-2 w-2/3 rounded-full bg-muted-foreground/20" />
        <span className="mt-2 w-fit rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
          Confirm email
        </span>
      </div>
    </div>
  )
}

function ImageTile({ name, meta, className }: { name: string; meta: string; className?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-dot-grid text-muted-foreground ring-1 ring-border/70",
          className
        )}
      >
        <Icon name="image" size="lg" />
      </div>
      <figcaption className="font-mono text-xs">
        <span className="block text-foreground">{name}</span>
        <span className="text-muted-foreground">{meta}</span>
      </figcaption>
    </figure>
  )
}

function ImagesVisual() {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <ImageTile name="ada.png" meta="2048² · 2.4 MB" className="size-28 sm:size-32" />
      <Icon name="arrow-right" className="shrink-0 text-muted-foreground" />
      <ImageTile name="ada.webp" meta="256² · 86 KB" className="size-20 text-brand-ink ring-brand-ink/40" />
    </div>
  )
}

/** Deterministic QR-style pattern (not a scannable code): three finder squares + seeded modules. */
function qrPath(size = 21): string {
  const finder = (x: number, y: number) => x < 7 && y < 7
  const inFinder = (x: number, y: number) =>
    finder(x, y) || finder(size - 1 - x, y) || finder(x, size - 1 - y)
  const finderOn = (x: number, y: number) => {
    const fx = x < 7 ? x : size - 1 - x
    const fy = y < 7 ? y : size - 1 - y
    const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3))
    return ring !== 2
  }
  let seed = 1042
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  let d = ""
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = inFinder(x, y) ? finderOn(x, y) : x !== 7 && y !== 7 && next() > 0.52
      if (on) d += `M${x} ${y}h1v1h-1z`
    }
  }
  return d
}

const QR_PATH = qrPath()

function QrVisual() {
  return (
    <div className="w-fit rounded-2xl elevation-control p-4">
      <svg viewBox="0 0 21 21" className="size-28 text-foreground" shapeRendering="crispEdges">
        <path d={QR_PATH} fill="currentColor" />
      </svg>
    </div>
  )
}

function UrlsVisual() {
  return (
    <div className="flex w-full flex-col gap-2 font-mono">
      <span className={cn(row, "block truncate text-muted-foreground")}>
        https://myapp.dpl.app/invite?ref=ada&utm_source=sms&utm_campaign=launch
      </span>
      <Icon name="arrow-right" className="mx-auto rotate-90 text-muted-foreground" />
      <span className={cn(row, "text-foreground ring-brand-ink/40")}>
        <Icon name="link" size="xs" className="text-brand-ink" />
        myapp.dpl.app/s/ada
      </span>
    </div>
  )
}

const validations: readonly { input: string; result: string; valid: boolean }[] = [
  { input: "ada@example.com", result: "Valid email", valid: true },
  { input: "+234 801 234 5678", result: "Valid · NG mobile", valid: true },
  { input: "0801-234", result: "Invalid number", valid: false },
]

function ValidationVisual() {
  return (
    <ul className="flex flex-col gap-2">
      {validations.map((item) => (
        <li key={item.input} className={row}>
          <span className="min-w-0 flex-1 truncate font-mono text-foreground">{item.input}</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5",
              item.valid ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon
              name={item.valid ? "check" : "x"}
              size="xs"
              className={item.valid ? "text-brand-ink" : "text-muted-foreground"}
            />
            {item.result}
          </span>
        </li>
      ))}
    </ul>
  )
}

const visuals: Record<string, () => React.ReactNode> = {
  otp: OtpVisual,
  sms: SmsVisual,
  notifications: NotificationsVisual,
  email: EmailVisual,
  images: ImagesVisual,
  qr: QrVisual,
  urls: UrlsVisual,
  validation: ValidationVisual,
}

/** The illustrative mini-UI for an API, by id. Unknown ids render nothing. */
export function ApiVisual({ id }: { id: string }) {
  const Visual = visuals[id]
  return Visual ? <Visual /> : null
}
