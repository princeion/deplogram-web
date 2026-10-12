import { cn } from "@/lib/utils"
import { codepadActions, codepadFiles, codepadSource } from "@/content/workspace"
import { Icon } from "@/components/shared/icon"
import { ProductWindow } from "@/components/marketing/product-window"

const tokenTone = {
  kw: "text-brand-ink",
  str: "text-success",
  fn: "text-foreground font-medium",
  cm: "text-muted-foreground italic",
  plain: "text-foreground/80",
} as const

/** CodePad — familiar and serious (brief §3): file tree, editor, Run / Save / Preview / Deploy, output. */
export function CodePadMock({ className }: { className?: string }) {
  return (
    <ProductWindow
      title="codepad / orders-api / src / server.ts"
      className={className}
      bodyClassName="grid md:grid-cols-[11rem_1fr]"
      actions={
        <span className="hidden items-center gap-1 sm:flex">
          {codepadActions.map((action) => (
            <span
              key={action.label}
              className={cn(
                "inline-flex h-6 items-center gap-1.5 px-2 text-[0.625rem] font-medium",
                action.label === "Deploy" ? "bg-brand text-brand-foreground" : action.label === "Run" ? "bg-foreground text-background" : "border border-border/70 bg-card"
              )}
            >
              <Icon name={action.icon} className="size-3" />
              {action.label}
            </span>
          ))}
        </span>
      }
    >
      <aside className="hidden border-r border-border/70 bg-background/60 py-3 md:block">
        <p className="px-4 pb-2 font-mono text-xs tracking-eyebrow text-muted-foreground uppercase">Files</p>
        <ul className="font-mono text-xs">
          {codepadFiles.map((file) => (
            <li
              key={file.name}
              className={cn("flex items-center gap-2 py-1.5 pr-3", file.active ? "bg-card text-foreground" : "text-muted-foreground")}
              style={{ paddingLeft: `${1 + file.depth * 0.75}rem` }}
            >
              <Icon name={file.folder ? "folder" : "file"} className="size-3.5" />
              {file.name}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex border-b border-border/70 font-mono text-[0.6875rem]">
          <span className="border-r border-border/70 bg-card px-4 py-2 text-foreground">server.ts</span>
          <span className="border-r border-border/70 px-4 py-2 text-muted-foreground">routes.ts</span>
        </div>
        <pre className="overflow-x-auto bg-card py-4 font-mono text-[0.75rem] leading-6" aria-label="Example code in CodePad">
          {codepadSource.map((line, i) => (
            <div key={i} className={cn("flex pr-6", i === 6 && "bg-brand/6")}>
              <span aria-hidden className="w-12 shrink-0 pr-4 text-right text-muted-foreground/50 select-none">
                {i + 1}
              </span>
              <code>
                {line.length === 0
                  ? " "
                  : line.map(([text, kind], j) => (
                      <span key={j} className={tokenTone[kind]}>
                        {text}
                      </span>
                    ))}
              </code>
            </div>
          ))}
        </pre>
        <div className="border-t border-border/70 bg-background/60">
          <div className="flex items-center gap-4 border-b border-border/70 px-4 py-2 font-mono text-xs tracking-eyebrow uppercase">
            <span className="text-foreground">Output</span>
            <span className="text-muted-foreground">Preview</span>
          </div>
          <div className="space-y-1 px-4 py-3 font-mono text-[0.6875rem]">
            <p className="text-muted-foreground">$ run server.ts</p>
            <p>listening on :8080</p>
            <p className="text-success">GET /orders → 200 · [&quot;#1042&quot;,&quot;#1043&quot;]</p>
          </div>
        </div>
      </div>
    </ProductWindow>
  )
}
