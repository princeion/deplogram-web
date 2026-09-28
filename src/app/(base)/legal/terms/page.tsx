import { createMetadata } from "@/lib/metadata"
import { termsOfService } from "@/content/legal"
import { LegalLayout } from "@/components/marketing/legal-layout"

export const metadata = createMetadata({
  title: termsOfService.title,
  description: termsOfService.description,
  path: "/legal/terms",
})

export default function TermsPage() {
  return <LegalLayout document={termsOfService} />
}
