/**
 * Base64 and JWT, done in the browser. Nothing here touches the network.
 */

export function bytesToBase64(bytes: Uint8Array, urlSafe = false) {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const b64 = btoa(binary)
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64
}

/** Accepts standard or URL-safe Base64, with or without padding and whitespace. */
export function base64ToBytes(value: string) {
  const normalised = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/")
  if (!/^[A-Za-z0-9+/]*=*$/.test(normalised)) throw new Error("That isn't Base64 — it has characters Base64 doesn't use.")
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export const textToBase64 = (text: string, urlSafe = false) => bytesToBase64(new TextEncoder().encode(text), urlSafe)

/** Decodes to text; reports whether the bytes were really text. */
export function base64ToText(value: string): { text: string; binary: boolean; bytes: Uint8Array } {
  const bytes = base64ToBytes(value)
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), binary: false, bytes }
  } catch {
    return { text: "", binary: true, bytes }
  }
}

// ── JWT ─────────────────────────────────────────────────────────────────────────────

export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  parts: [string, string, string]
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".")
  if (parts.length !== 3) throw new Error(`A JWT has three parts separated by dots — this has ${parts.length}.`)
  const json = (part: string, name: string) => {
    try {
      const value: unknown = JSON.parse(new TextDecoder().decode(base64ToBytes(part)))
      if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error()
      return value as Record<string, unknown>
    } catch {
      throw new Error(`The ${name} isn't valid Base64-encoded JSON.`)
    }
  }
  return { header: json(parts[0], "header"), payload: json(parts[1], "payload"), signature: parts[2], parts: parts as [string, string, string] }
}

const hmac: Record<string, string> = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" }

/** Verifies an HS256/384/512 signature with a shared secret. Other algorithms need a public key. */
export async function verifyHmac(decoded: DecodedJwt, secret: string): Promise<boolean> {
  const alg = String(decoded.header.alg ?? "")
  const hash = hmac[alg]
  if (!hash) throw new Error(`Checking ${alg || "this"} signatures needs a public key — only HS256, HS384 and HS512 work with a secret here.`)
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash }, false, ["sign"])
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${decoded.parts[0]}.${decoded.parts[1]}`))
  return bytesToBase64(new Uint8Array(signed), true) === decoded.signature.replace(/=+$/, "")
}

export const canVerifyWithSecret = (alg: unknown) => typeof alg === "string" && alg in hmac
