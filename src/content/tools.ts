import type { FeatureItem } from "@/content/types"

/** Developer utilities — fast, no-install tools. Free on every plan (Blueprint §2, §4). */
export const tools: readonly FeatureItem[] = [
  { title: "JSON formatter", description: "Format, validate and minify JSON.", icon: "braces" },
  { title: "JSON → TypeScript", description: "Paste JSON, get typed interfaces.", icon: "file-code" },
  { title: "Base64", description: "Encode and decode text or files.", icon: "binary" },
  { title: "URL encoder", description: "Encode and decode URL components.", icon: "link" },
  { title: "Hash generator", description: "MD5, SHA-1, SHA-256 and SHA-512.", icon: "hash" },
  { title: "UUID generator", description: "v4 UUIDs, one or a thousand.", icon: "sparkles" },
  { title: "JWT decoder", description: "Inspect headers, claims and expiry.", icon: "key-round" },
  { title: "Timestamp converter", description: "Unix time ⇄ human dates, any zone.", icon: "clock" },
  { title: "Regex tester", description: "Live matches, groups and flags.", icon: "regex" },
  { title: "Cron helper", description: "Build and explain cron expressions.", icon: "calendar-clock" },
  { title: "Webhook tester", description: "Catch, inspect and replay requests.", icon: "webhook" },
  { title: "API request builder", description: "Compose, send and save HTTP requests.", icon: "send" },
]
