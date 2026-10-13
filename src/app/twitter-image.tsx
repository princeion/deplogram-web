import { ImageResponse } from "next/og"

import { OgCard, loadHeadingFont } from "@/lib/brand-image"

export const alt = "Deplogram — build, deploy and run your apps on one lightweight developer cloud."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  return new ImageResponse(<OgCard eyebrow="The lightweight developer cloud · early access" title="Build, deploy and run your apps on one developer cloud." />, {
    ...size,
    fonts: [{ name: "Host Grotesk", data: await loadHeadingFont(), style: "normal", weight: 600 }],
  })
}
