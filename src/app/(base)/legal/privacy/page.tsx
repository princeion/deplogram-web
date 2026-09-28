import { createMetadata } from "@/lib/metadata"
import { privacyPolicy } from "@/content/legal"
import { LegalLayout } from "@/components/marketing/legal-layout"

export const metadata = createMetadata({
  title: privacyPolicy.title,
  description: privacyPolicy.description,
  path: "/legal/privacy",
})

export default function PrivacyPage() {
  return <LegalLayout document={privacyPolicy} />
}
