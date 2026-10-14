import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/app-shell/page"
import { DeleteAccount } from "@/features/account/components/delete-account"

export const metadata: Metadata = {
  title: "Delete account",
}

export default function DeleteAccountPage() {
  return (
    <Page width="narrow">
      <PageHeader title="Delete account" description="Remove your account and everything in it." />
      <DeleteAccount />
    </Page>
  )
}
