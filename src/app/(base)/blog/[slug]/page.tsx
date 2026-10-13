import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { formatDate } from "@/lib/format"
import { createMetadata } from "@/lib/metadata"
import { getPost, posts, sortedPosts } from "@/content/blog"
import { BadgePill } from "@/components/shared/badge-pill"
import { Container } from "@/components/shared/container"
import { Icon } from "@/components/shared/icon"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { BlogCard } from "@/components/marketing/blog-card"
import { BlogCover } from "@/components/marketing/blog-cover"
import { ContentBlocks, Prose } from "@/components/marketing/prose"

export const dynamicParams = false

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params
  const post = getPost(slug)
  if (!post) return {}
  return createMetadata({ title: post.title, description: post.excerpt, path: `/blog/${post.slug}`, type: "article" })
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params
  const post = getPost(slug)
  if (!post) notFound()
  const more = sortedPosts.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <>
      <article className="pt-28 sm:pt-36">
        <Container size="narrow">
          <FadeInUp>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon name="arrow-right" className="rotate-180" />
              All posts
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <BadgePill>{post.tag}</BadgePill>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="mt-5 font-heading text-title font-medium text-balance">{post.title}</h1>
            <p className="mt-5 text-lead text-pretty text-muted-foreground">{post.excerpt}</p>
            <p className="mt-6 text-sm text-foreground">{post.author}</p>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <BlogCover tag={post.tag} className="mt-10 aspect-video" />
          </FadeInUp>
          <Prose className="mt-12">
            <ContentBlocks blocks={post.blocks} />
          </Prose>
        </Container>
      </article>

      {more.length > 0 && (
        <SectionWrapper>
          <Container>
            <h2 className="font-heading text-2xl font-medium">Keep reading</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {more.map((p) => (
                <li key={p.slug}>
                  <BlogCard post={p} />
                </li>
              ))}
            </ul>
          </Container>
        </SectionWrapper>
      )}
    </>
  )
}
