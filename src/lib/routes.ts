import { posts } from "@/content/blog"
import { docPages } from "@/content/docs"

/** Every public route in the marketing site — used by the sitemap. */
export function publicRoutes(): { path: string; lastModified?: string; priority: number }[] {
  return [
    { path: "/", priority: 1 },
    { path: "/pricing", priority: 0.9 },
    { path: "/docs", priority: 0.8 },
    ...docPages.map((page) => ({ path: page.href, priority: 0.7 })),
    { path: "/changelog", priority: 0.6 },
    { path: "/blog", priority: 0.7 },
    ...posts.map((post) => ({ path: `/blog/${post.slug}`, lastModified: post.date, priority: 0.6 })),
    { path: "/about", priority: 0.6 },
    { path: "/careers", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/status", priority: 0.4 },
    { path: "/legal/privacy", priority: 0.3 },
    { path: "/legal/terms", priority: 0.3 },
  ]
}
