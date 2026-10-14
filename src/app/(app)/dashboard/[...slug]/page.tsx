import type { Metadata } from "next"

import { PendingPage } from "@/components/app-shell/pending-page"

export const metadata: Metadata = {
  title: "Coming soon",
}

/**
 * Development scaffold: any Galley route in the navigation that has no page yet renders inside the
 * shell instead of 404ing. Real pages take precedence automatically; delete this once every
 * route in src/lib/navigation/config.ts has its own page.
 */
export default function PendingRoute() {
  return <PendingPage />
}
