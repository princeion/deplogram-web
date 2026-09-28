"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { DURATION, EASE_OUT } from "@/lib/motion"
import type { ApiItem } from "@/content/apis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/shared/icon"
import { CodePreview } from "@/components/marketing/code-preview"

/** Tabbed SDK snippets, one per API. Panels cross-fade in as they mount (Base UI unmounts inactive panels). */
export function ApiExplorer({ apis }: { apis: readonly ApiItem[] }) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = React.useState(apis[0]?.id ?? "")

  return (
    <Tabs value={active} onValueChange={(value) => setActive(String(value))} className="gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" data-lenis-prevent>
        <TabsList className="h-10 rounded-full elevation-control p-1">
          {apis.map((api) => (
            <TabsTrigger key={api.id} value={api.id} className="rounded-full px-3.5">
              <Icon name={api.icon} size="xs" />
              {api.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {apis.map((api) => (
        <TabsContent key={api.id} value={api.id}>
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
          >
            <CodePreview title={`${api.id}.ts`} code={api.snippet} />
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
