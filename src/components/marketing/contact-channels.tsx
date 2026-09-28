import type { contactChannels } from "@/content/contact"
import { Icon } from "@/components/shared/icon"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

export function ContactChannels({ channels }: { channels: typeof contactChannels }) {
  return (
    <StaggerGroup as="ul" className="grid content-start gap-3">
      {channels.map((channel) => (
        <StaggerItem as="li" key={channel.email}>
          <a
            href={`mailto:${channel.email}`}
            className="group flex gap-4 rounded-2xl elevation-surface p-5 transition-colors hover:border-brand-ink/30"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg elevation-control text-brand-ink">
              <Icon name={channel.icon} size="md" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-heading font-semibold">{channel.title}</span>
              <span className="text-sm text-muted-foreground">{channel.description}</span>
              <span className="font-mono text-sm text-foreground group-hover:text-brand-ink">{channel.email}</span>
            </span>
          </a>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
