import * as React from "react"

import type { ComparisonGroup, ComparisonValue, Plan } from "@/content/pricing"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Icon } from "@/components/shared/icon"

function Value({ value }: { value: ComparisonValue }) {
  if (value === true) return <Icon name="check" className="mx-auto text-brand-ink" label="Included" />
  if (value === false) return <Icon name="minus" className="mx-auto text-muted-foreground/50" label="Not included" />
  return <span className="text-sm">{value}</span>
}

/** Feature comparison table across plans (shadcn Table). */
export function PricingComparison({ plans, groups }: { plans: readonly Plan[]; groups: readonly ComparisonGroup[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl elevation-surface" data-lenis-prevent>
      <Table className="min-w-2xl">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-2/5 px-6 py-4 font-mono text-xs tracking-eyebrow uppercase">Feature</TableHead>
            {plans.map((plan) => (
              <TableHead key={plan.id} className="px-4 py-4 text-center font-heading text-base font-semibold text-foreground">
                {plan.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <React.Fragment key={group.title}>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableCell
                  colSpan={plans.length + 1}
                  className="px-6 py-2.5 font-mono text-xs tracking-eyebrow text-brand-ink uppercase"
                >
                  {group.title}
                </TableCell>
              </TableRow>
              {group.rows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="px-6 py-3.5 whitespace-normal text-foreground">{row.feature}</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="px-4 py-3.5 text-center">
                      <Value value={row.values[plan.id]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
