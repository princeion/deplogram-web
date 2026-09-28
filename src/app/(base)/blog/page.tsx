import { createMetadata } from "@/lib/metadata"
import { sortedPosts } from "@/content/blog"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { BlogCard } from "@/components/marketing/blog-card"
import { PageHeader } from "@/components/marketing/page-header"

export const metadata = createMetadata({
  title: "Blog",
  description: "Product updates, engineering notes and guides from the Deplogram team.",
  path: "/blog",
})

export default function BlogIndexPage() {
  const [featured, ...rest] = sortedPosts
  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Notes from the build"
        description="Product updates, engineering deep-dives and guides from the Deplogram team."
      />
      <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
        <Container className="flex flex-col gap-4">
          {featured && (
            <FadeInUp>
              <HoverScale scale={1.005}>
                <BlogCard post={featured} featured />
              </HoverScale>
            </FadeInUp>
          )}
          <StaggerGroup as="ul" className="grid gap-4 md:grid-cols-2">
            {rest.map((post) => (
              <StaggerItem as="li" key={post.slug}>
                <HoverScale className="h-full" scale={1.01}>
                  <BlogCard post={post} />
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </SectionWrapper>
    </>
  )
}
