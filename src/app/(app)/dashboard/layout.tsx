import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"

export const metadata: Metadata = {
  title: { default: "Your Galley", template: "%s — Your Galley" },
}

export default function GalleyLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppShell>{children}</AppShell>
}
