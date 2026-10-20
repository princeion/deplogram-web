/**
 * The static preview: the pad's HTML with its own stylesheets and scripts inlined, so it renders
 * in a sandboxed iframe (srcdoc) with no server. Uses the working copy — unsaved edits included —
 * so the preview follows typing. Links to files that aren't in the pad are left alone.
 */
export function buildStaticPreview(entry: string, read: (path: string) => string | undefined): string | null {
  const html = read(entry)
  if (html == null) return null
  const local = (href: string) => href.replace(/^\.\//, "").replace(/^\//, "")
  const escapeScript = (code: string) => code.replace(/<\/script/gi, "<\\/script")

  return html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
      const css = href ? read(local(href)) : undefined
      return css == null ? tag : `<style data-file="${local(href!)}">\n${css}\n</style>`
    })
    .replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, before: string, src: string, after: string) => {
      const js = read(local(src))
      if (js == null) return tag
      const attrs = `${before} ${after}`.replace(/\s+/g, " ").trim()
      return `<script${attrs ? ` ${attrs}` : ""} data-file="${local(src)}">\n${escapeScript(js)}\n</script>`
    })
}
