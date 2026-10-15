import type { Metadata } from "next"

import { Page } from "@/components/app-shell/page"
import { GalleyOverview } from "@/features/overview/components/galley-overview"
import { getWorldMap } from "@/features/overview/world-map"

export const metadata: Metadata = {
  title: "Overview",
}

export default function OverviewPage() {
  // The dotted world map is computed here, on the server; only its coordinates go to the browser.
  return (
    <Page width="wide">
      <GalleyOverview map={getWorldMap()} />
    </Page>
  )
}
