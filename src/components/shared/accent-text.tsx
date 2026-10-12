import * as React from "react"

/** Highlighted words in a headline render in the brand ink. */
export const accentClass = "text-brand-ink"

/**
 * Renders headline markup: `*words*` are highlighted in the brand ink, "\n" forces a line break.
 * e.g. "Serve and test\nyour work *seamlessly.*"
 */
export function AccentText({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {line.split("*").map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className={accentClass}>
                {part}
              </span>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            )
          )}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  )
}
