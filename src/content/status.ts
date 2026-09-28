export type ServiceStatus = "operational" | "degraded" | "outage"

export type StatusService = {
  name: string
  description: string
  status: ServiceStatus
}

// TODO: static placeholder — wire to a real status source (health checks / incident feed) before launch.
export const statusServices: readonly StatusService[] = [
  { name: "Deployments", description: "Git-triggered builds and releases", status: "operational" },
  { name: "Build pipeline", description: "Framework detection, installs and builds", status: "operational" },
  { name: "Edge & HTTPS", description: "Traffic serving and certificate provisioning", status: "operational" },
  { name: "DNS & domains", description: "dpl.app addresses, domain search and custom domains", status: "operational" },
  { name: "APIs", description: "OTP, notifications, SMS, email, images, URLs, QR and validation", status: "operational" },
  { name: "Storage", description: "Files, assets and backups", status: "operational" },
  { name: "Developer utilities", description: "Browser-based tools", status: "operational" },
  { name: "Dashboard", description: "Web app and CLI authentication", status: "operational" },
]

export const statusLabel: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
}
