import type { IconName } from "@/components/shared/icon"

/** The six utilities, in the order the sidebar lists them. `local`: runs entirely in the browser. */
export const utilityList: readonly { id: string; title: string; description: string; icon: IconName; sample: string; local: boolean }[] = [
  { id: "json", title: "JSON formatter", description: "Format, validate and minify JSON — with the line and column of any error.", icon: "braces", sample: '{"ok":true,"port":8080}', local: true },
  { id: "jwt", title: "JWT decoder", description: "Read a token's header and claims, see when it expires, and check its signature.", icon: "key-round", sample: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIi…", local: true },
  { id: "base64", title: "Base64", description: "Encode and decode text and files, standard or URL-safe.", icon: "binary", sample: "RGVwbG9ncmFt", local: true },
  { id: "regex", title: "Regex tester", description: "Matches highlighted as you type, with groups, flags and replace.", icon: "regex", sample: "/(?<user>\w+)@(?<host>[\w.]+)/g", local: true },
  { id: "cron", title: "Cron helper", description: "Read a schedule in plain English and see when it runs next.", icon: "calendar-clock", sample: "0 9 * * 1-5", local: true },
  { id: "webhooks", title: "Webhook tester", description: "A URL that catches requests so you can inspect them and replay them at your server.", icon: "webhook", sample: "POST /  200  · GitHub", local: false },
]
