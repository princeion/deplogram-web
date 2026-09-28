import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type CreateMetadataInput = {
  title: string
  description: string
  /** Route path, e.g. "/pricing" — used for the canonical URL and og:url. */
  path: string
  type?: "website" | "article"
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
    openGraph: { title, description, url: path, type },
    twitter: { title, description },
  }
}
