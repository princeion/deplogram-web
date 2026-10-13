import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"
import { socialImages } from "@/lib/metadata"
import { faq } from "@/content/faq"
import { homeCopy } from "@/content/home"
import { runtimes } from "@/content/runtimes"
import { Container } from "@/components/shared/container"
import { FadeInUp } from "@/components/shared/motion/fade-in-up"
import { SectionWrapper } from "@/components/shared/section-wrapper"
import { CtaBand } from "@/components/marketing/cta-band"
import { DeployConsole } from "@/components/marketing/deploy-console"
import { Faq } from "@/components/marketing/faq"
import { GalleyMock } from "@/components/marketing/galley-mock"
import { Hero } from "@/components/marketing/hero"
import { JsonLd } from "@/components/marketing/json-ld"
import { ProductCards, ProductStage, type ProductCardItem } from "@/components/marketing/product-cards"
import { RuntimesStrip } from "@/components/marketing/runtimes-strip"
import { SectionHeader } from "@/components/marketing/section-header"

const homeTitle = `${siteConfig.name} — Build, deploy and run apps on a lightweight developer cloud`

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: { title: homeTitle, description: siteConfig.description, url: "/", siteName: siteConfig.name, images: socialImages.openGraph },
  twitter: { card: "summary_large_image", title: homeTitle, description: siteConfig.description, images: socialImages.twitter },
}

/** The product family, as Codex-style cards with animated illustrations. */
const products: readonly ProductCardItem[] = [
  { title: "Deploy", href: "/deploy", cta: "Explore Deploy", illustration: "deploy" },
  { title: "CodePad", href: "/codepad", cta: "Explore CodePad", illustration: "codepad" },
  { title: "Storage", href: "/storage", cta: "Explore Storage", illustration: "storage" },
  { title: "Utilities & APIs", href: "/tools", cta: "Explore the toolkit", illustration: "apis" },
]

/** The homepage is an overview: each product is introduced once and explained on its own page. */
const homeFaq = faq.slice(0, 4)

export default function HomePage() {
  const c = homeCopy
  return (
    <>
      <JsonLd faq={homeFaq} />
      <Hero {...c.hero} visual={<DeployConsole />} footer={<RuntimesStrip {...c.runtimes} runtimes={runtimes} />} />

      <SectionWrapper id="platform">
        <Container>
          <SectionHeader {...c.platform} align="center" className="mx-auto" />
          <ProductCards items={products} className="mt-12 sm:mt-16" />
        </Container>
      </SectionWrapper>

      <SectionWrapper id="galley">
        <Container>
          <SectionHeader {...c.galley} align="center" className="mx-auto" />
          <FadeInUp distance={28} className="mt-12 sm:mt-16">
            <ProductStage variant="c" source="lime">
              <GalleyMock className="mx-auto max-w-5xl" />
            </ProductStage>
          </FadeInUp>
        </Container>
      </SectionWrapper>

      <Faq {...c.faq} items={homeFaq} />

      <CtaBand {...c.cta} />
    </>
  )
}
