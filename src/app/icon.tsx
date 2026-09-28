import { ImageResponse } from "next/og"

import { BrandMark } from "@/lib/brand-image"
import { themeColors } from "@/lib/theme"

// TODO: swap for the final logo mark once brand assets exist.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <BrandMark size={28} />
      </div>
    ),
    size
  )
}
