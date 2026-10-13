import { cn } from "@/lib/utils"
import { ProductWindow } from "@/components/marketing/product-window"

type CodePreviewProps = {
  title: string
  code: string
  className?: string
}

/** Static code/terminal block in the product-window chrome (blog and legal prose). */
export function CodePreview({ title, code, className }: CodePreviewProps) {
  return (
    <ProductWindow title={title} className={cn("not-prose", className)}>
      <pre className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed text-foreground sm:p-5" data-lenis-prevent>
        <code>{code}</code>
      </pre>
    </ProductWindow>
  )
}
