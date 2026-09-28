import { siteConfig } from "@/lib/site"

/** Organization + WebSite structured data for the homepage. */
export function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/apple-icon`,
      email: siteConfig.emails.hello,
      parentOrganization: { "@type": "Organization", name: siteConfig.operator },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    },
  ]
  return (
    <script
      type="application/ld+json"
      // Static, server-built JSON with no user input; `<` is escaped defensively.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
