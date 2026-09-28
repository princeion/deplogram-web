import Link from "next/link"
import type { Metadata } from "next"

import { buttonVariants } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { Container } from "@/components/shared/container"
import { StatusMessage } from "@/components/shared/status-message"

export const metadata: Metadata = {
  title: "Dashboard",
}

// TODO: placeholder only. Lives at /dashboard because (app)/page.tsx would collide with the homepage at "/".
export default function DashboardPage() {
  return (
    <>
      <Container className="absolute inset-x-0 top-0 z-10 flex h-16 items-center">
        <Logo />
      </Container>
      <StatusMessage
        eyebrow="Dashboard"
        title="The dashboard is being built."
        description="Deplogram is in early access. Leave your details and we'll let you know as soon as you can deploy."
        graphState="loading"
      >
        <Link href="/contact?topic=general" className={buttonVariants({ variant: "inverted", size: "lg" })}>
          Request early access
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to home
        </Link>
      </StatusMessage>
    </>
  )
}
