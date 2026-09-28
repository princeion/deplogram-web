import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import type { BlogPost } from "@/content/blog"
import { BadgePill } from "@/components/shared/badge-pill"
import { SpotlightCard } from "@/components/shared/motion/spotlight-card"
import { BlogCover } from "@/components/marketing/blog-cover"

type BlogCardProps = {
  post: BlogPost
  /** Featured = wide two-column layout for the newest post. */
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <SpotlightCard className="h-full">
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "flex h-full flex-col gap-5 rounded-2xl p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          featured && "md:grid md:grid-cols-2 md:items-center md:gap-8"
        )}
      >
        <BlogCover tag={post.tag} className={featured ? "aspect-video md:aspect-4/3" : "aspect-video"} />
        <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <BadgePill>{post.tag}</BadgePill>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingTime}</span>
          </div>
          <h2
            className={cn(
              "font-heading font-semibold text-balance",
              featured ? "text-heading" : "text-subheading"
            )}
          >
            {post.title}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">{post.excerpt}</p>
          <p className="mt-auto pt-2 text-sm text-muted-foreground">{post.author}</p>
        </div>
      </Link>
    </SpotlightCard>
  )
}
