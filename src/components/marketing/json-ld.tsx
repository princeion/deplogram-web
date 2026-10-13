import { siteConfig } from "@/lib/site"
import type { FaqItem } from "@/content/faq"

/**
 * Homepage structured data: Organization, WebSite, the product as a SoftwareApplication and,
 * when given, the visible FAQ as an FAQPage.
 */
export function JsonLd({ faq }: { faq?: readonly FaqItem[] }) {
  const data: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/apple-icon`,
      email: siteConfig.emails.hello,
      parentOrganization: { "@type": "Organization", name: siteConfig.operator },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#organization` },
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${siteConfig.url}/#organization` },
      featureList: [
        "Deploy from GitHub to a live URL",
        "Eight runtimes: Vite, Next.js, Node.js, Python, PHP, Go, Static Sites, Docker",
        "CodePad online code editor",
        "File storage",
        "Six developer utilities",
        "OTP, email, image transform and QR code APIs",
      ],
    },
  ]

  if (faq?.length) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/\*/g, "") },
      })),
    })
  }

  return (
    <script
      type="application/ld+json"
      // Static, server-built JSON with no user input; `<` is escaped defensively.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
