import type { FeatureItem } from "@/content/types"

// Source: Product & Technical Brief §1, §8 — six utilities and four APIs (reduced from 12 + 8).
// TODO: the brief fixes the counts, not the exact list. Confirm these picks with the product team.

/** Six utilities — browser tools for the small jobs between commits. */
export const utilities: readonly (FeatureItem & { sample: string })[] = [
  { title: "JSON formatter", description: "Format, validate and minify JSON.", icon: "braces", sample: '{ "ok": true }' },
  { title: "JWT decoder", description: "Inspect the header, claims and expiry.", icon: "key-round", sample: "eyJhbGciOi…" },
  { title: "Base64", description: "Encode and decode text and files.", icon: "binary", sample: "ZGVwbG9ncmFt" },
  { title: "Regex tester", description: "Live matches, groups and flags.", icon: "regex", sample: "/^[a-z-]+$/g" },
  { title: "Cron helper", description: "Build a schedule and read it in plain English.", icon: "calendar-clock", sample: "0 9 * * 1-5" },
  { title: "Webhook tester", description: "Catch, inspect and replay incoming requests.", icon: "webhook", sample: "POST /hook 200" },
]

export type ApiItem = FeatureItem & {
  id: string
  method: "POST" | "GET"
  endpoint: string
  /** Illustrative request body for the showcase. */
  request: string
  response: string
}

/** Four APIs. Endpoints, requests and responses stay technical (brief §3). Illustrative, not final. */
export const apis: readonly ApiItem[] = [
  {
    id: "otp",
    title: "OTP",
    description: "Send and verify one-time codes without standing up an auth service.",
    icon: "fingerprint",
    method: "POST",
    endpoint: "/v1/otp/send",
    request: `{
  "to": "+2348012345678",
  "channel": "sms"
}`,
    response: `{
  "id": "otp_8Kd2…",
  "status": "sent",
  "expires_in": 300
}`,
  },
  {
    id: "email",
    title: "Email",
    description: "Transactional email from your own domain, with reusable templates.",
    icon: "mail",
    method: "POST",
    endpoint: "/v1/email/send",
    request: `{
  "to": "ada@example.com",
  "template": "order-confirmation",
  "data": { "order": 1042 }
}`,
    response: `{
  "id": "em_2Qp9…",
  "status": "queued"
}`,
  },
  {
    id: "images",
    title: "Image transform",
    description: "Resize, compress and convert images on the way in or on the fly.",
    icon: "image",
    method: "POST",
    endpoint: "/v1/images/transform",
    request: `{
  "source": "storage://uploads/product.png",
  "width": 640,
  "format": "webp"
}`,
    response: `{
  "url": "https://cdn.dpl.app/i/7fa1.webp",
  "bytes": 48213
}`,
  },
  {
    id: "qr",
    title: "QR codes",
    description: "Generate QR codes as PNG or SVG for tickets, payments and sign-ins.",
    icon: "qr-code",
    method: "POST",
    endpoint: "/v1/qr",
    request: `{
  "data": "https://orders-api.dpl.app/orders/1042",
  "format": "svg"
}`,
    response: `{
  "url": "https://cdn.dpl.app/q/order-1042.svg"
}`,
  },
]
