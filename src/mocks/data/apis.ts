import QRCode from "qrcode"

import { apiOfPath, apiIds, type ApiId, type ApiKey, type ApiRequest, type ApiUsage, type NewApiKey, type TryRequest, type TryResult } from "@/features/apis/apis"
import { mockViewer } from "@/mocks/data/viewer"

/**
 * The mock APIs: keys, a month of usage, recent requests, and "Try it" — which really does the
 * work where it can (image transforms run on a canvas, QR codes are drawn), so what comes back
 * looks like the real thing. Outputs are blob: URLs standing in for CDN URLs.
 */

const now = Date.now()
const ago = (ms: number) => new Date(now - ms).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const hex = (n: number) => Array.from({ length: n }, () => "0123456789abcdefghjkmnpqrstvwxyz"[Math.floor(Math.random() * 32)]).join("")

// ── Keys ────────────────────────────────────────────────────────────────────────

let keys: ApiKey[] = [
  { id: "key_1", name: "orders-api production", prefix: "dpl_live_3fk2", mode: "live", access: [], createdAt: ago(41 * DAY), lastUsedAt: ago(2 * MIN), createdBy: mockViewer.name ?? "you" },
  { id: "key_2", name: "Signup flow", prefix: "dpl_live_8qwm", mode: "live", access: ["otp", "email"], createdAt: ago(18 * DAY), lastUsedAt: ago(3 * DAY), createdBy: mockViewer.name ?? "you" },
  { id: "key_3", name: "Local and CI", prefix: "dpl_test_9c1e", mode: "test", access: [], createdAt: ago(40 * DAY), lastUsedAt: ago(5 * HOUR), createdBy: mockViewer.name ?? "you" },
]
let keySeq = keys.length

// ── Usage ───────────────────────────────────────────────────────────────────────

const plan: Record<ApiId, { limit: number; perDay: number; p50: number; errors: number }> = {
  otp: { limit: 500, perDay: 12, p50: 412, errors: 0.012 },
  email: { limit: 3_000, perDay: 70, p50: 186, errors: 0.004 },
  images: { limit: 5_000, perDay: 162, p50: 238, errors: 0.006 },
  qr: { limit: 10_000, perDay: 80, p50: 41, errors: 0.001 },
}

function usage(): ApiUsage {
  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
  return {
    period: { start: start.toISOString(), end: end.toISOString() },
    apis: apiIds.map((id, n) => {
      const rand = random(97 + n * 31)
      const daily = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now - (29 - i) * DAY)
        const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
        const requests = Math.round(plan[id].perDay * (weekend ? 0.55 : 1) * (0.7 + rand() * 0.6) * (0.85 + i / 100))
        return { date: date.toISOString().slice(0, 10), requests, errors: Math.round(requests * plan[id].errors * (rand() * 2)) }
      })
      const used = daily.filter((d) => d.date >= start.toISOString().slice(0, 10)).reduce((sum, d) => sum + d.requests, 0)
      return { id, used, limit: plan[id].limit, successRate: 1 - plan[id].errors, p50Ms: plan[id].p50, daily }
    }),
  }
}

// ── Requests ────────────────────────────────────────────────────────────────────

const samplePaths: Record<ApiId, [ApiRequest["method"], string][]> = {
  otp: [
    ["POST", "/v1/otp/send"],
    ["POST", "/v1/otp/verify"],
  ],
  email: [["POST", "/v1/email/send"]],
  images: [["POST", "/v1/images/transform"]],
  qr: [["POST", "/v1/qr"]],
}

let requests: ApiRequest[] = (() => {
  const rand = random(7)
  return Array.from({ length: 40 }, (_, i): ApiRequest => {
    const api = apiIds[Math.floor(rand() * 4)]
    const [method, path] = samplePaths[api][Math.floor(rand() * samplePaths[api].length)]
    const failed = rand() < 0.08
    const key = rand() < 0.7 ? keys[0] : rand() < 0.5 ? keys[1] : keys[2]
    return {
      id: `req_${i}`,
      api,
      method,
      path,
      status: failed ? (path.endsWith("verify") ? 422 : 429) : 200,
      durationMs: Math.round(plan[api].p50 * (0.6 + rand() * 0.9)),
      keyPrefix: key.prefix,
      mode: key.mode,
      at: ago(Math.round((i + rand()) * 47 * MIN)),
    }
  })
})()

function log(request: TryRequest, result: TryResult) {
  const api = apiOfPath(request.path)
  if (!api) return
  const entry: ApiRequest = { id: `req_${hex(8)}`, api, method: request.method, path: request.path, status: result.status, durationMs: result.durationMs, keyPrefix: "dpl_test_9c1e", mode: "test", at: new Date().toISOString() }
  requests = [entry, ...requests].slice(0, 200)
}

// ── Try it ──────────────────────────────────────────────────────────────────────

const sentCodes = new Map<string, { code: string; attempts: number; expiresAt: number }>()

/** Storage paths in the samples map to images the app ships with. */
const sampleImages: Record<string, string> = {
  "storage://assets/images/product-shot.png": "/images/gradient-flow.webp",
  "storage://assets/images/team-offsite.jpg": "/images/gradient-ember.webp",
  "storage://assets/images/og-image.png": "/images/gradient-lime.webp",
}

const fail = (status: number, code: string, message: string) => ({ status, body: { error: { code, message } } })

async function transform(body: Record<string, unknown>) {
  const source = String(body.source ?? "")
  const local = sampleImages[source] ?? (source.startsWith("/") ? source : null)
  if (!local && !/^https:\/\//.test(source)) return fail(422, "invalid_source", "source must be a Storage path (storage://…) or an https URL.")
  const response = await fetch(local ?? source).catch(() => null)
  if (!response?.ok) return fail(422, "source_unreachable", "Couldn't fetch the source image.")
  const original = await response.blob()
  const bitmap = await createImageBitmap(original)
  const w = typeof body.width === "number" ? body.width : undefined
  const h = typeof body.height === "number" ? body.height : undefined
  if ((w && w > 4000) || (h && h > 4000)) return fail(422, "too_large", "width and height go up to 4000.")
  const ratio = bitmap.width / bitmap.height
  const fit = String(body.fit ?? "inside")
  let width = w ?? Math.round((h ?? bitmap.height) * ratio)
  let height = h ?? Math.round(width / ratio)
  if (w && h && fit === "inside") {
    // Fit within the box, keeping proportions.
    const scale = Math.min(w / bitmap.width, h / bitmap.height)
    width = Math.round(bitmap.width * scale)
    height = Math.round(bitmap.height * scale)
  }
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext("2d")!
  if (fit === "cover") {
    const scale = Math.max(width / bitmap.width, height / bitmap.height)
    ctx.drawImage(bitmap, (width - bitmap.width * scale) / 2, (height - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale)
  } else if (fit === "contain") {
    const scale = Math.min(width / bitmap.width, height / bitmap.height)
    ctx.drawImage(bitmap, (width - bitmap.width * scale) / 2, (height - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale)
  } else {
    ctx.drawImage(bitmap, 0, 0, width, height)
  }
  const format = String(body.format ?? "webp")
  // Browsers can't encode AVIF on a canvas; the mock makes WebP and calls it AVIF.
  const type = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp"
  const quality = typeof body.quality === "number" ? Math.min(100, Math.max(1, body.quality)) / 100 : 0.8
  const output = await canvas.convertToBlob({ type, quality })
  const id = `img_${hex(10)}`
  return {
    status: 200,
    body: { id, url: URL.createObjectURL(output), width, height, format, bytes: output.size, source_bytes: original.size },
  }
}

async function qr(body: Record<string, unknown>) {
  const data = String(body.data ?? "")
  if (!data) return fail(422, "missing_data", "data is required.")
  if (data.length > 2000) return fail(422, "too_long", "data can be up to 2,000 characters.")
  const size = typeof body.size === "number" ? Math.min(2000, Math.max(64, body.size)) : 320
  const options = {
    errorCorrectionLevel: (String(body.error_correction ?? "M") as "L" | "M" | "Q" | "H"),
    margin: 2,
    width: size,
    color: { dark: String(body.color ?? "#000000"), light: String(body.background ?? "#ffffff") },
  }
  const format = body.format === "png" ? "png" : "svg"
  const blob =
    format === "svg"
      ? new Blob([await QRCode.toString(data, { ...options, type: "svg" })], { type: "image/svg+xml" })
      : await (await fetch(await QRCode.toDataURL(data, options))).blob()
  return { status: 200, body: { id: `qr_${hex(10)}`, url: URL.createObjectURL(blob), format, size, bytes: blob.size } }
}

async function run(request: TryRequest): Promise<{ status: number; body: unknown }> {
  const body = request.body ?? {}
  switch (request.path) {
    case "/v1/otp/send": {
      const to = String(body.to ?? "")
      const channel = String(body.channel ?? "sms")
      if (channel === "email" ? !/^\S+@\S+\.\S+$/.test(to) : !/^\+\d{8,15}$/.test(to.replace(/\s/g, ""))) {
        return fail(422, "invalid_recipient", channel === "email" ? "to must be an email address." : "to must be a phone number with its country code, like +2348012345678.")
      }
      const length = [4, 6, 8].includes(Number(body.length)) ? Number(body.length) : 6
      const id = `otp_${hex(12)}`
      sentCodes.set(id, { code: "0".repeat(length), attempts: 0, expiresAt: Date.now() + 300_000 })
      return { status: 200, body: { id, status: "sent", channel, to, expires_in: 300, test: true } }
    }
    case "/v1/otp/verify": {
      const sent = sentCodes.get(String(body.id ?? ""))
      if (!sent) return fail(404, "not_found", "No code with that id — send one first.")
      if (Date.now() > sent.expiresAt) return fail(410, "expired", "That code has expired.")
      if (sent.attempts >= 5) return fail(429, "too_many_attempts", "Too many wrong tries — send a new code.")
      sent.attempts++
      const valid = String(body.code ?? "") === sent.code
      if (valid) sentCodes.delete(String(body.id))
      return { status: 200, body: { valid, attempts_left: valid ? null : 5 - sent.attempts } }
    }
    case "/v1/email/send": {
      const to = String(body.to ?? "")
      if (!/^\S+@\S+\.\S+$/.test(to)) return fail(422, "invalid_recipient", "to must be an email address.")
      if (to !== mockViewer.email) return fail(403, "test_recipient", `Test keys only send to your own address (${mockViewer.email}).`)
      if (!String(body.subject ?? "").trim()) return fail(422, "missing_subject", "subject is required.")
      return { status: 200, body: { id: `em_${hex(12)}`, status: "queued", to, test: true } }
    }
    case "/v1/images/transform":
      return transform(body)
    case "/v1/qr":
      return qr(body)
    default:
      return fail(404, "not_found", `No endpoint ${request.method} ${request.path}.`)
  }
}

export const mockApis = {
  usage,
  requests: (api?: ApiId) => (api ? requests.filter((r) => r.api === api) : requests).slice(0, 50),
  async try(request: TryRequest): Promise<TryResult> {
    const started = performance.now()
    const outcome = await run(request)
    const api = apiOfPath(request.path)
    const durationMs = Math.round(performance.now() - started + (api ? plan[api].p50 * (0.7 + Math.random() * 0.5) : 50))
    const result = { ...outcome, durationMs }
    log(request, result)
    return result
  },
  keys: () => keys,
  createKey(input: NewApiKey) {
    const secret = `dpl_${input.mode}_${hex(40)}`
    const key: ApiKey = {
      id: `key_${++keySeq}`,
      name: input.name,
      prefix: secret.slice(0, 13),
      mode: input.mode,
      access: input.access,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      createdBy: mockViewer.name ?? "you",
    }
    keys = [key, ...keys]
    return { ...key, secret }
  },
  revokeKey(id: string) {
    const found = keys.some((k) => k.id === id)
    keys = keys.filter((k) => k.id !== id)
    return found
  },
}
