import type { Metadata } from "next"

// Placeholder app shell. The product app may live at app.deplogram.app as a separate project —
// don't build this out until that decision is final (see docs/design-system.md Retrospective Log).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>
}
