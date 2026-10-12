import { posts } from "@/content/blog"

/** Every public route in the marketing site — used by the sitemap. */
export function publicRoutes(): { path: string; lastModified?: string; priority: number }[] {
  return [
    { path: "/", priority: 1 },
    { path: "/waitlist", priority: 0.9 },
    { path: "/deploy", priority: 0.9 },
    { path: "/runtimes", priority: 0.8 },
    { path: "/codepad", priority: 0.8 },
    { path: "/storage", priority: 0.8 },
    { path: "/tools", priority: 0.8 },
    { path: "/roadmap", priority: 0.7 },
    { path: "/blog", priority: 0.6 },
    ...posts.map((post) => ({ path: `/blog/${post.slug}`, lastModified: post.date, priority: 0.5 })),
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/legal/privacy", priority: 0.3 },
    { path: "/legal/terms", priority: 0.3 },
  ]
}
