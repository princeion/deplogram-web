import type { FeatureItem } from "@/content/types"

export type ApiItem = FeatureItem & {
  id: string
  /** Spans two bento columns. Order is wide/narrow, narrow/wide… so every 3-column row is full. */
  wide?: boolean
  /** Illustrative usage snippet for the API showcase tabs. */
  snippet: string
}

// TODO: snippets are illustrative — replace with the real SDK surface once @deplogram/sdk is published.
// Source: Product & Pricing Blueprint §2 (APIs pillar). Every API is on Freebies with an included quota.
export const apis: readonly ApiItem[] = [
  {
    id: "otp",
    wide: true,
    title: "OTP",
    description: "Send and verify one-time codes over SMS or email without standing up an auth service.",
    icon: "fingerprint",
    snippet: `import { otp } from "@deplogram/sdk"

await otp.send({ to: "+2348012345678", channel: "sms" })

const { valid } = await otp.verify({
  to: "+2348012345678",
  code: input.code,
})`,
  },
  {
    id: "sms",
    title: "SMS",
    description: "Transactional SMS with delivery tuned for African networks.",
    icon: "smartphone",
    snippet: `import { sms } from "@deplogram/sdk"

await sms.send({
  to: "+2348012345678",
  body: "Your order #1042 is on its way.",
})`,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "One call to reach a user on the channel that fits — email, SMS or both.",
    icon: "bell",
    snippet: `import { notify } from "@deplogram/sdk"

await notify.send({
  to: { email: "ada@example.com", phone: "+2348012345678" },
  template: "order-shipped",
  data: { orderId: 1042 },
})`,
  },
  {
    id: "email",
    wide: true,
    title: "Email",
    description: "Transactional email with reusable templates, sent from your own domain.",
    icon: "mail",
    snippet: `import { email } from "@deplogram/sdk"

await email.send({
  to: "ada@example.com",
  template: "welcome",
  data: { name: "Ada" },
})`,
  },
  {
    id: "images",
    wide: true,
    title: "Image & file processing",
    description: "Resize, compress and convert images and files on the way in or on the fly.",
    icon: "image",
    snippet: `import { images } from "@deplogram/sdk"

const thumb = await images.transform({
  source: "storage://avatars/ada.png",
  width: 256,
  format: "webp",
})`,
  },
  {
    id: "qr",
    title: "QR codes",
    description: "Generate QR codes as PNG or SVG for tickets, payments and sign-ins.",
    icon: "qr-code",
    snippet: `import { qr } from "@deplogram/sdk"

const code = await qr.generate({
  data: "https://myapp.dpl.app/ticket/1042",
  format: "svg",
})`,
  },
  {
    id: "urls",
    title: "URL utilities",
    description: "Short links, redirects and link previews for anything you share.",
    icon: "link",
    snippet: `import { sms, urls } from "@deplogram/sdk"

const link = await urls.shorten({
  url: "https://myapp.dpl.app/invite?ref=ada",
})

await sms.send({ to: invitee.phone, body: link.short })`,
  },
  {
    id: "validation",
    wide: true,
    title: "Validation",
    description: "Check email addresses and phone numbers before they reach your database.",
    icon: "badge-check",
    snippet: `import { validate } from "@deplogram/sdk"

const phone = await validate.phone("+2348012345678")

phone.valid   // true
phone.country // "NG"`,
  },
]
