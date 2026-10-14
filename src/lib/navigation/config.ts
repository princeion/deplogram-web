import type { NavScope, NavSection } from "@/lib/navigation/types"

/**
 * Your Galley's navigation — the single source for the sidebar, mobile menu, breadcrumbs and the
 * command palette. Names stay technical (brief §3); add a link here and it appears everywhere.
 *
 * The sidebar is context-switching: it shows one scope at a time (workspace, a project, settings,
 * utilities, APIs), picked from the URL. Areas with sub-pages are scopes of their own, so no list
 * ever nests.
 *
 * Route map (all under /dashboard):
 *   /                          Overview — projects and deployments first
 *   /projects                  All projects
 *   /projects/[projectId]/…    One project: overview, deployments, logs, metrics, environment, settings
 *   /deployments · /activity   Across projects
 *   /codepad · /storage        Build tools
 *   /utilities/…  · /apis/…    Toolkit scopes
 *   /usage                     Plan limits and current usage (limits, never prices — brief §6)
 *   /team                      Members and roles (after MVP)
 *   /settings/…                Account settings scope
 */

const backToGalley = { label: "Back to Galley", href: "/dashboard" }

const workspace: NavScope = {
  id: "workspace",
  match: "/dashboard",
  sections: [
    {
      id: "workspace",
      items: [
        { id: "overview", label: "Overview", href: "/dashboard", icon: "home", match: "exact", keywords: ["home", "dashboard", "galley"] },
        { id: "projects", label: "Projects", href: "/dashboard/projects", icon: "folder", keywords: ["apps", "services", "sites"] },
        { id: "deployments", label: "Deployments", href: "/dashboard/deployments", icon: "rocket", keywords: ["builds", "releases", "redeploy"] },
        { id: "activity", label: "Activity", href: "/dashboard/activity", icon: "activity", keywords: ["audit", "events", "history"] },
      ],
    },
    {
      id: "build",
      label: "Build",
      items: [
        { id: "codepad", label: "CodePad", href: "/dashboard/codepad", icon: "code", flag: "codepad", keywords: ["editor", "ide", "code"] },
        { id: "storage", label: "Storage", href: "/dashboard/storage", icon: "database", flag: "storage", keywords: ["files", "uploads", "buckets", "objects"] },
      ],
    },
    {
      id: "toolkit",
      label: "Toolkit",
      items: [
        { id: "utilities", label: "Utilities", href: "/dashboard/utilities", icon: "wrench", flag: "utilities", keywords: ["tools"] },
        { id: "apis", label: "APIs", href: "/dashboard/apis", icon: "plug", flag: "apis", keywords: ["otp", "email", "image", "qr"] },
      ],
    },
    {
      id: "manage",
      label: "Manage",
      items: [
        { id: "usage", label: "Usage & limits", href: "/dashboard/usage", icon: "gauge", keywords: ["plan", "quota", "active deployments", "upgrade"] },
        { id: "team", label: "Team", href: "/dashboard/team", icon: "users", soon: true, keywords: ["members", "invite", "roles"] },
        { id: "settings", label: "Settings", href: "/dashboard/settings", icon: "settings", keywords: ["account", "profile", "preferences"] },
      ],
    },
  ],
}

/** One project. `[projectId]` is filled from the route; the switcher shows the project's name. */
const project: NavScope = {
  id: "project",
  match: "/dashboard/projects/[projectId]",
  back: { label: "All projects", href: "/dashboard/projects" },
  sections: [
    {
      id: "project",
      items: [
        { id: "project-overview", label: "Overview", href: "/dashboard/projects/[projectId]", icon: "home", match: "exact" },
        { id: "project-deployments", label: "Deployments", href: "/dashboard/projects/[projectId]/deployments", icon: "rocket", keywords: ["builds", "redeploy"] },
        { id: "project-logs", label: "Logs", href: "/dashboard/projects/[projectId]/logs", icon: "scroll-text", keywords: ["build logs", "runtime logs"] },
        { id: "project-metrics", label: "Metrics", href: "/dashboard/projects/[projectId]/metrics", icon: "analytics", keywords: ["cpu", "memory", "requests"] },
        { id: "project-environment", label: "Environment", href: "/dashboard/projects/[projectId]/environment", icon: "variable", keywords: ["env", "variables", "secrets"] },
        { id: "project-settings", label: "Settings", href: "/dashboard/projects/[projectId]/settings", icon: "settings", keywords: ["build command", "start command", "port", "runtime"] },
      ],
    },
  ],
}

const utilities: NavScope = {
  id: "utilities",
  match: "/dashboard/utilities",
  title: "Utilities",
  back: backToGalley,
  sections: [
    {
      id: "utilities",
      items: [
        { id: "utilities-all", label: "All utilities", href: "/dashboard/utilities", icon: "layout", match: "exact" },
        { id: "utility-json", label: "JSON formatter", href: "/dashboard/utilities/json", icon: "braces", keywords: ["format", "validate", "minify"] },
        { id: "utility-jwt", label: "JWT decoder", href: "/dashboard/utilities/jwt", icon: "key-round", keywords: ["token", "claims"] },
        { id: "utility-base64", label: "Base64", href: "/dashboard/utilities/base64", icon: "binary", keywords: ["encode", "decode"] },
        { id: "utility-regex", label: "Regex tester", href: "/dashboard/utilities/regex", icon: "regex", keywords: ["regular expression", "match"] },
        { id: "utility-cron", label: "Cron helper", href: "/dashboard/utilities/cron", icon: "calendar-clock", keywords: ["schedule", "crontab"] },
        { id: "utility-webhooks", label: "Webhook tester", href: "/dashboard/utilities/webhooks", icon: "webhook", keywords: ["requests", "inspect", "replay"] },
      ],
    },
  ],
}

const apis: NavScope = {
  id: "apis",
  match: "/dashboard/apis",
  title: "APIs",
  back: backToGalley,
  sections: [
    {
      id: "apis",
      items: [
        { id: "apis-overview", label: "Overview", href: "/dashboard/apis", icon: "layout", match: "exact" },
        { id: "api-keys", label: "API keys", href: "/dashboard/apis/keys", icon: "key-round", keywords: ["token", "secret", "credentials"] },
      ],
    },
    {
      id: "apis-reference",
      label: "APIs",
      items: [
        { id: "api-otp", label: "OTP", href: "/dashboard/apis/otp", icon: "fingerprint", keywords: ["one-time", "verification", "sms"] },
        { id: "api-email", label: "Email", href: "/dashboard/apis/email", icon: "mail", keywords: ["transactional", "templates", "send"] },
        { id: "api-images", label: "Image transform", href: "/dashboard/apis/images", icon: "image", keywords: ["resize", "compress", "webp"] },
        { id: "api-qr", label: "QR codes", href: "/dashboard/apis/qr", icon: "qr-code", keywords: ["qr", "barcode"] },
      ],
    },
  ],
}

const settings: NavScope = {
  id: "settings",
  match: "/dashboard/settings",
  title: "Settings",
  back: backToGalley,
  sections: [
    {
      id: "settings",
      items: [
        { id: "settings-general", label: "General", href: "/dashboard/settings", icon: "user", match: "exact", keywords: ["profile", "name", "avatar"] },
        { id: "settings-security", label: "Security", href: "/dashboard/settings/security", icon: "shield", keywords: ["password", "sessions", "two-factor"] },
        { id: "settings-notifications", label: "Notifications", href: "/dashboard/settings/notifications", icon: "bell", keywords: ["email", "alerts"] },
        { id: "settings-git", label: "Git connections", href: "/dashboard/settings/git", icon: "github", keywords: ["github", "repositories"] },
        { id: "settings-delete", label: "Delete account", href: "/dashboard/settings/delete", icon: "trash", keywords: ["danger", "remove"] },
      ],
    },
  ],
}

/** Every scope. The most specific `match` for the current path wins (see resolveScope). */
export const navigationScopes: readonly NavScope[] = [workspace, project, utilities, apis, settings]

/** Help, docs and feedback — pinned to the bottom of the sidebar in every scope. */
export const footerNavigation: readonly NavSection[] = [
  {
    id: "help",
    items: [
      { id: "docs", label: "Documentation", href: "/docs", icon: "book", soon: true, keywords: ["guides", "reference"] },
      { id: "roadmap", label: "What's coming", href: "/roadmap", icon: "news", keywords: ["roadmap", "changelog", "updates"] },
      { id: "support", label: "Help & support", href: "/contact", icon: "help", keywords: ["contact", "support"] },
      { id: "feedback", label: "Send feedback", href: "/contact?topic=feedback", icon: "message", keywords: ["idea", "bug", "report"] },
    ],
  },
]
