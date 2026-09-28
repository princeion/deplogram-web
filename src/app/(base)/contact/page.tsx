import { createMetadata } from "@/lib/metadata"
import { contactChannels, isContactTopic } from "@/content/contact"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { ContactChannels } from "@/components/marketing/contact-channels"
import { ContactForm } from "@/components/marketing/contact-form"
import { PageHeader } from "@/components/marketing/page-header"

export const metadata = createMetadata({
  title: "Contact",
  description: "Talk to the Deplogram team about plans, support, partnerships or careers.",
  path: "/contact",
})

export default async function ContactPage(props: PageProps<"/contact">) {
  const { topic } = await props.searchParams
  const defaultTopic = isContactTopic(topic) ? topic : "general"

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk."
        description="Questions about plans, the built-in APIs, partnerships or joining the team — send a note and a person will reply."
      />
      <SectionWrapper spacing="compact" className="pb-20 sm:pb-24">
        <Container className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <FadeInUp>
            <ContactForm key={defaultTopic} defaultTopic={defaultTopic} />
          </FadeInUp>
          <ContactChannels channels={contactChannels} />
        </Container>
      </SectionWrapper>
    </>
  )
}
