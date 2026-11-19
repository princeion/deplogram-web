import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell/app-shell"
import { AuthenticatedContent } from "@/features/auth/components/authenticated-content"

export const metadata: Metadata = {
  title: { default: "Your Galley", template: "%s — Your Galley" },
}

export default function GalleyLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AppShell>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </AppShell>
  )
}
