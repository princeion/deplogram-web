import { setupWorker } from "msw/browser"

import { handlers } from "@/mocks/handlers"
import { isLive } from "@/mocks/live-endpoints"

/**
 * "enabled": every endpoint is mocked. "partial": only what the real backend doesn't serve yet
 * (see live-endpoints.ts); the rest goes to NEXT_PUBLIC_API_URL.
 */
const partial = process.env.NEXT_PUBLIC_API_MOCKING === "partial"

export const worker = setupWorker(
  ...(partial ? handlers.filter((h) => !(typeof h.info.path === "string" && isLive(String(h.info.method), h.info.path))) : handlers)
)
