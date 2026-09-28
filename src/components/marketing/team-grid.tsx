import type { TeamMember } from "@/content/company"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HoverScale } from "@/components/shared/motion/hover-scale"
import { StaggerGroup, StaggerItem } from "@/components/shared/motion/stagger"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TeamGrid({ members }: { members: readonly TeamMember[] }) {
  return (
    <StaggerGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {members.map((member, i) => (
        <StaggerItem as="li" key={`${member.name}-${i}`}>
          <HoverScale className="h-full">
            <div className="flex h-full flex-col items-start gap-4 rounded-2xl elevation-surface p-6">
              {/* TODO: render the member photo with <AvatarImage> (next/image-backed) once assets exist. */}
              <Avatar className="size-14">
                <AvatarFallback className="bg-muted font-heading text-base text-brand-ink">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          </HoverScale>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
