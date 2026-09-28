import * as React from "react"

import { Footer } from "@/components/marketing/footer"
import { Navbar } from "@/components/marketing/navbar"

/** Navbar + main + footer. Used by the (base) layout and by the root not-found / error pages. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-sm text-brand-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </>
  )
}
