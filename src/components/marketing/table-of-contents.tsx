type Heading = { id: string; text: string }

/** "On this page" list for long-form pages. Sticky on desktop. */
export function TableOfContents({ headings }: { headings: readonly Heading[] }) {
  if (headings.length === 0) return <div />
  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-28">
      <p className="mb-4 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">On this page</p>
      <ul className="flex flex-col gap-2 border-l border-border/70 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent pl-4 text-muted-foreground transition-colors hover:border-brand-ink hover:text-foreground"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
