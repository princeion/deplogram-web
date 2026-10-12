import { ImageResponse } from "next/og"

import { OgCard, loadHeadingFont } from "@/lib/brand-image"

export const alt = "Deplogram — the lightweight developer cloud. Cuisine a masterpiece with ease."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  return new ImageResponse(<OgCard eyebrow="The lightweight developer cloud · early access" title="Cuisine a masterpiece with ease." />, {
    ...size,
    fonts: [{ name: "Host Grotesk", data: await loadHeadingFont(), style: "normal", weight: 600 }],
  })
}
