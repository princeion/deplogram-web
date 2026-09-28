import Link from "next/link"

import { siteConfig } from "@/lib/site"
import type { Role } from "@/content/company"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

/** Open roles as a list of Surface rows. Each links to contact until roles have their own pages. */
export function RolesList({ roles }: { roles: readonly Role[] }) {
  return (
    <StaggerGroup as="ul" className="flex flex-col gap-3">
      {roles.map((role) => (
        <StaggerItem as="li" key={role.title}>
          {/* TODO: link each role to its own application page. */}
          <Link
            href={`/contact?topic=careers`}
            className="group flex flex-col gap-3 rounded-2xl elevation-surface p-5 transition-colors hover:border-brand-ink/30 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <div>
              <p className="font-heading text-subheading font-semibold">{role.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {role.team} · {role.location} · {role.type}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
              Apply
              <Icon
                name="arrow-up-right"
                className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </Link>
        </StaggerItem>
      ))}
      <li className="pt-2 text-sm text-muted-foreground">
        Don&apos;t see your role? Write to{" "}
        <a href={`mailto:${siteConfig.emails.careers}`} className="text-foreground underline underline-offset-4">
          {siteConfig.emails.careers}
        </a>
        .
      </li>
    </StaggerGroup>
  )
}
