import type { MetadataRoute } from "next"

import { publicRoutes } from "@/lib/routes"
import { siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes().map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: route.lastModified ? new Date(route.lastModified) : undefined,
    priority: route.priority,
  }))
}
