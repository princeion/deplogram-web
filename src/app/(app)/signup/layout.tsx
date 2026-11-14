import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
}

// The page uses client-side state, which needs a Suspense boundary to prerender.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>
}
