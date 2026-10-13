import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type CreateMetadataInput = {
  title: string
  description: string
  /** Route path, e.g. "/pricing" — used for the canonical URL and og:url. */
  path: string
  type?: "website" | "article"
}

/** Shared social images (the root `opengraph-image` / `twitter-image` routes). A page that sets
 * `openGraph` / `twitter` replaces the parent objects, so every page re-attaches them. */
export const socialImages = {
  openGraph: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — ${siteConfig.positioning}` }],
  twitter: ["/twitter-image"],
}

/** Per-page metadata with canonical + Open Graph URL. Title is templated by the root layout. */
export function createMetadata({
  title,
  description,
  path,
  type = "website",
}: CreateMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, siteName: siteConfig.name, images: socialImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: socialImages.twitter },
  }
}
