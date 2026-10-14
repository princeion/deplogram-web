import type { Metadata } from "next"

import { MswProvider } from "@/mocks/msw-provider"

// The product app (Your Galley) lives here, under /dashboard. Not indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-app className="flex min-h-full flex-1 flex-col">
      {/* Mock API in development (NEXT_PUBLIC_API_MOCKING=enabled) until the backend exists. */}
      <MswProvider>{children}</MswProvider>
    </div>
  )
}
