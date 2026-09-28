/**
 * JS mirror of the colour tokens in src/app/globals.css, for places that cannot read CSS variables
 * (next/og ImageResponse: OG image, app icons). Keep in sync with globals.css + docs/design-system.md.
 */
export const themeColors = {
  brand: "#FF5C35",
  /** `--brand` at 16% — the OG card's corner wash. */
  brandWash: "rgba(255, 92, 53, 0.16)",
  brandForeground: "#0a0a0a",
  background: "#000000",
  card: "#0a0a0a",
  foreground: "#fafafa",
  mutedForeground: "#a4a4a4",
  border: "#262626",
} as const
