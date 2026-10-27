"use client"

import { notificationEvents, useNotificationSettings, useUpdateNotifications, type NotificationEvent } from "@/features/account/notifications"
import { notify } from "@/components/feedback"
import { Icon } from "@/components/shared/icon"
import { Segmented } from "@/components/shared/segmented"
import { SettingRow, SettingsTable } from "@/components/shared/settings-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ErrorState } from "@/components/app-shell/error-state"
import { PageSection } from "@/components/app-shell/page"

const groups = [...new Set(notificationEvents.map((e) => e.group))]

/** Settings › Notifications: where emails go, a weekly summary, and a switch per kind of email. Saves as you go. */
export function NotificationSettings() {
  const { data, isPending, isError, refetch } = useNotificationSettings()
  const update = useUpdateNotifications()

  const save = (change: Parameters<typeof update.mutate>[0]) =>
    update.mutate(change, { onError: (error) => notify.error(error, { title: "Couldn't save that change" }) })

  if (isPending) {
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }
  if (isError) return <ErrorState title="Notification settings didn't load." onRetry={() => refetch()} />

  return (
    <>
      <SettingsTable>
        <SettingRow label="Send to">
          <span className="flex min-w-0 items-center gap-2 px-2 text-sm">
            <span className="truncate font-mono">{data.email}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">— your sign-in email</span>
          </span>
        </SettingRow>
        <SettingRow label="Weekly summary">
          <span className="flex flex-wrap items-center gap-3 px-1">
            <Segmented
              label="Weekly summary"
              size="sm"
              value={data.digest}
              onChange={(digest) => save({ digest })}
              options={[
                { value: "weekly", label: "Mondays" },
                { value: "off", label: "Off" },
              ]}
            />
            <span className="text-xs text-muted-foreground">Deploys, usage and anything that needs you, in one email.</span>
          </span>
        </SettingRow>
      </SettingsTable>

      {groups.map((group) => (
        <PageSection key={group} title={group}>
          <ul className="surface-raised divide-y divide-border/50 overflow-hidden rounded-xl">
            {notificationEvents
              .filter((e) => e.group === group)
              .map((event) => (
                <EventRow key={event.id} event={event} on={data.events[event.id] ?? false} onChange={(on) => save({ events: { [event.id]: on } })} />
              ))}
          </ul>
        </PageSection>
      ))}
    </>
  )
}

function EventRow({ event, on, onChange }: { event: (typeof notificationEvents)[number]; on: boolean; onChange: (on: boolean) => void }) {
  const id = `notify-${event.id satisfies NotificationEvent}`
  const locked = "locked" in event && event.locked
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <label htmlFor={id} className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {event.label}
          {locked && <Icon name="lock" size="xs" className="text-muted-foreground" />}
        </span>
        <span className="text-xs text-pretty text-muted-foreground">{event.description}</span>
      </label>
      <Switch id={id} checked={locked || on} disabled={locked} onCheckedChange={onChange} />
    </li>
  )
}
