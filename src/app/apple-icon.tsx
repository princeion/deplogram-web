import { ImageResponse } from "next/og"

import { BrandMark } from "@/lib/brand-image"
import { themeColors } from "@/lib/theme"

// TODO: swap for the final logo mark once brand assets exist.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: themeColors.background,
        }}
      >
        <BrandMark size={128} glow />
      </div>
    ),
    size
  )
}
