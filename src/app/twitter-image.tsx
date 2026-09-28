import { ImageResponse } from "next/og"

import { OgCard, loadHeadingFont } from "@/lib/brand-image"

export const alt = "Deplogram — Developer infrastructure, APIs & utilities. Build. Deploy. Store. Connect."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  return new ImageResponse(<OgCard eyebrow="Developer infrastructure, APIs & utilities" title="Build. Deploy. Store. Connect." />, {
    ...size,
    fonts: [{ name: "Host Grotesk", data: await loadHeadingFont(), style: "normal", weight: 600 }],
  })
}
