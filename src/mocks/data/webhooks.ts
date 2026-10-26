import type { WebhookRequest, WebhookSample } from "@/features/utilities/webhooks"

/** The mock capture URL and what it has received. */

const token = () => Math.random().toString(36).slice(2, 10)
let endpoint = { url: `https://hooks.dpl.app/h/${token()}`, createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() }
let seq = 0
const ip = () => `102.89.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`

function sample(kind: WebhookSample, at = new Date()): WebhookRequest {
  const id = `wh_${++seq}${token().slice(0, 4)}`
  if (kind === "github-push") {
    const body = JSON.stringify(
      {
        ref: "refs/heads/main",
        before: "5210972c1e8f4b2d9a0f6e3c7b1d8a4e2f6c9b0d",
        after: "72c32b8e4a1d9f0b6c3e8a2d7f1b4c9e0a5d3f6b",
        repository: { id: 812331045, name: "orders-api", full_name: "ada-obi/orders-api", private: true },
        pusher: { name: "ada-obi", email: "ada@example.com" },
        head_commit: { id: "72c32b8", message: "feat: add order filters", timestamp: at.toISOString() },
      },
      null,
      2
    )
    return {
      id,
      method: "POST",
      path: "/",
      query: [],
      headers: [
        ["content-type", "application/json"],
        ["user-agent", "GitHub-Hookshot/7b2c1f0"],
        ["x-github-event", "push"],
        ["x-github-delivery", "8f1c2a70-9b11-11ef-8c1f-2f6f0d9a1c55"],
        ["x-hub-signature-256", "sha256=3d5c0f9b…e21a"],
      ],
      body,
      contentType: "application/json",
      size: body.length,
      ip: "140.82.115.43",
      receivedAt: at.toISOString(),
    }
  }
  if (kind === "paystack-charge") {
    const body = JSON.stringify(
      {
        event: "charge.success",
        data: { id: 4127730154, reference: "ord_1042_9fk2", amount: 4850000, currency: "NGN", channel: "card", customer: { email: "adaeze@example.com" }, paid_at: at.toISOString() },
      },
      null,
      2
    )
    return {
      id,
      method: "POST",
      path: "/",
      query: [],
      headers: [
        ["content-type", "application/json"],
        ["user-agent", "Paystack/1.0"],
        ["x-paystack-signature", "a6f1c09e7b…d42f"],
      ],
      body,
      contentType: "application/json",
      size: body.length,
      ip: "52.31.139.75",
      receivedAt: at.toISOString(),
    }
  }
  const body = "name=Funke+Adebayo&email=funke%40example.com&plan=plus&source=landing"
  return {
    id,
    method: "POST",
    path: "/signup",
    query: [["ref", "newsletter"]],
    headers: [
      ["content-type", "application/x-www-form-urlencoded"],
      ["user-agent", "Mozilla/5.0 (Linux; Android 14)"],
    ],
    body,
    contentType: "application/x-www-form-urlencoded",
    size: body.length,
    ip: ip(),
    receivedAt: at.toISOString(),
  }
}

let requests: WebhookRequest[] = [
  sample("paystack-charge", new Date(Date.now() - 4 * 60_000)),
  sample("github-push", new Date(Date.now() - 26 * 60_000)),
  sample("form", new Date(Date.now() - 3 * 3_600_000)),
]

export const mockWebhooks = {
  endpoint: () => endpoint,
  rotate() {
    endpoint = { url: `https://hooks.dpl.app/h/${token()}`, createdAt: new Date().toISOString() }
    requests = []
    return endpoint
  },
  list: () => requests.slice(0, 50),
  clear: () => {
    requests = []
  },
  send(kind: WebhookSample) {
    const request = sample(kind)
    requests = [request, ...requests]
    return request
  },
  get: (id: string) => requests.find((r) => r.id === id) ?? null,
}
