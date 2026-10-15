"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { runtimes } from "@/content/runtimes"
import { staticRuntimes, type Branch, type Repository } from "@/features/deploy/deploy"
import type { NewDeploymentValues } from "@/features/deploy/components/schema"
import { useUsage } from "@/features/usage/usage"
import { Icon, type IconName } from "@/components/shared/icon"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Callout } from "@/components/feedback"
import { UsageMeter } from "@/components/charts"

function Section({ title, icon, onEdit, children }: { title: string; icon: IconName; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 rounded-xl border border-border/70 bg-background/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Icon name={icon} size="sm" className="text-muted-foreground" />
          {title}
        </h3>
        <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="grid gap-2 text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-[0.8rem]" : "truncate"}>{children}</dd>
    </div>
  )
}

/** Live deployments on the plan, before and after this one — and a stop sign if it's full. */
export function PlanCheck() {
  const { data, isPending } = useUsage()
  const limit = data?.limits.find((l) => l.id === "active_deployments")
  if (isPending) return <Skeleton className="h-16 rounded-xl" />
  if (!limit) return null
  const full = limit.used >= limit.limit
  return full ? (
    <Callout tone="danger" icon="gauge" title={`All ${limit.limit} live deployments on your plan are in use`}>
      Take a project offline to deploy this one. Redeploys of existing projects still work.
    </Callout>
  ) : (
    <div className="grid gap-2 rounded-xl border border-border/70 bg-background/25 p-4">
      <p className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2">
          <Icon name="gauge" size="sm" className="text-muted-foreground" />
          Live deployments
        </span>
        <span className="text-muted-foreground tabular-nums">
          {limit.used} of {limit.limit} → <span className="text-foreground">{limit.used + 1} after this</span>
        </span>
      </p>
      <UsageMeter used={limit.used + 1} limit={limit.limit} label="Live deployments after this deploy" />
    </div>
  )
}

/** Step 4 — everything at a glance, each part editable, then Deploy. */
export function ReviewStep({ repository, branch, onEdit }: { repository?: Repository; branch?: Branch; onEdit: (step: string) => void }) {
  const { control } = useFormContext<NewDeploymentValues>()
  const values = useWatch({ control }) as NewDeploymentValues
  const runtime = runtimes.find((r) => r.id === values.runtime)
  const isStatic = staticRuntimes.includes(values.runtime)
  const env = (values.env ?? []).filter((row) => row?.key)

  return (
    <div className="grid gap-4">
      <Section title="Source" icon="github" onEdit={() => onEdit("source")}>
        <Row label="Repository">{repository?.fullName ?? "—"}</Row>
        <Row label="Branch" mono>
          {values.branch}
        </Row>
        {branch && (
          <Row label="Commit" mono>
            {branch.commit.sha} <span className="font-sans text-muted-foreground">{branch.commit.message}</span>
          </Row>
        )}
      </Section>

      <Section title="Runtime & settings" icon="hammer" onEdit={() => onEdit("configure")}>
        <Row label="Project">
          {values.name} <span className="text-muted-foreground">· {values.name}.dpl.app</span>
        </Row>
        <Row label="Runtime">{runtime?.name ?? "—"}</Row>
        <Row label="Build" mono>
          {values.buildCommand || "—"}
        </Row>
        {!isStatic && (
          <>
            <Row label="Start" mono>
              {values.startCommand || "From the Dockerfile"}
            </Row>
            <Row label="Port" mono>
              {values.port}
            </Row>
          </>
        )}
        {values.rootDirectory && (
          <Row label="Root directory" mono>
            {values.rootDirectory}
          </Row>
        )}
      </Section>

      <Section title="Environment" icon="key-round" onEdit={() => onEdit("configure")}>
        {env.length === 0 ? (
          <p className="text-sm text-muted-foreground">No environment variables.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {env.map((row) => (
              <span
                key={row.key}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 font-mono text-[0.7rem]",
                  row.value ? "border-border/70 bg-background/40" : "border-brand/40 bg-brand/[0.06] text-brand-ink"
                )}
              >
                {row.key}
                <span className="text-muted-foreground">{row.value ? "=••••" : "= (empty)"}</span>
              </span>
            ))}
          </div>
        )}
        {env.some((row) => !row.value) && (
          <p className="flex items-start gap-1.5 text-xs text-brand-ink">
            <Icon name="triangle" size="xs" className="mt-0.5 shrink-0" />
            {env.filter((row) => !row.value).length === 1 ? "One variable has" : `${env.filter((row) => !row.value).length} variables have`} no value and will be set to an empty
            string. Add values under Configure if your app needs them.
          </p>
        )}
      </Section>

      <PlanCheck />
    </div>
  )
}
