import type { ContentBlock, IconName } from "@/content/types"

export type DocPage = {
  slug: string
  href: string
  title: string
  description: string
  icon: IconName
  blocks: readonly ContentBlock[]
}

export type DocsNavSection = {
  title: string
  items: readonly { title: string; href?: string }[]
}

/** Sidebar. Items without `href` are listed as "soon" — the full docs are out of scope for now. */
export const docsNav: readonly DocsNavSection[] = [
  {
    title: "Get started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Getting started", href: "/docs/getting-started" },
      { title: "Deploying your first project", href: "/docs/deploying-your-first-project" },
    ],
  },
  {
    title: "Deployments",
    items: [{ title: "Runtimes" }, { title: "Environment variables" }, { title: "Persistent deployments" }, { title: "Background jobs + cron" }, { title: "Rollbacks" }],
  },
  {
    title: "APIs",
    items: [
      { title: "API keys" },
      { title: "OTP" },
      { title: "Notifications" },
      { title: "SMS" },
      { title: "Email" },
      { title: "Image & file processing" },
      { title: "URL utilities" },
      { title: "QR codes" },
      { title: "Validation" },
    ],
  },
  {
    title: "Storage & domains",
    items: [{ title: "Storage" }, { title: "Buying a domain" }, { title: "Connecting a domain" }],
  },
]

// TODO: stub articles — the full documentation is a separate project.
export const docPages: readonly DocPage[] = [
  {
    slug: "getting-started",
    href: "/docs/getting-started",
    icon: "book-open",
    title: "Getting started",
    description: "Create an account, connect GitHub and understand how Deplogram fits together.",
    blocks: [
      {
        type: "p",
        text: "Deplogram gives you APIs, developer utilities, storage, domains and deployments from one account. This page covers the two-minute setup; the next one walks through your first deploy.",
      },
      { type: "h2", text: "1. Create your account" },
      {
        type: "p",
        text: "Sign up with GitHub. The Freebies plan includes the core APIs, every developer utility, test deployments on `dpl.app` and a small storage allowance.",
      },
      { type: "h2", text: "2. Connect GitHub" },
      {
        type: "p",
        text: "Install the Deplogram GitHub app on the repositories you want to deploy. You can grant access to all repositories or pick them one by one.",
      },
      { type: "h2", text: "3. Install the CLI (optional)" },
      { type: "p", text: "Everything works from the dashboard, but the CLI is handy for logs and env vars." },
      { type: "code", title: "Terminal", code: "bun add -g @deplogram/cli\ndpl login" },
      {
        type: "callout",
        title: "Preview",
        text: "The CLI package name and commands shown here are illustrative and may change before general availability.",
      },
      { type: "h2", text: "How the pieces fit" },
      {
        type: "ul",
        items: [
          "**API keys** authenticate calls to the built-in APIs; usage for each key shows in your dashboard.",
          "**Projects** map to a repository and a runtime.",
          "**Deployments** are immutable builds of a commit — every one can be rolled back to.",
          "**Storage** holds files, assets and backups separately from your deployments.",
          "**Domains** point at a project; `myapp.dpl.app` is created automatically.",
        ],
      },
    ],
  },
  {
    slug: "deploying-your-first-project",
    href: "/docs/deploying-your-first-project",
    icon: "git-branch",
    title: "Deploying your first project",
    description: "From an existing repo to a live URL on dpl.app in a few minutes.",
    blocks: [
      {
        type: "p",
        text: "This guide deploys an existing Next.js app, but the steps are the same for every supported runtime — Deplogram detects the framework for you.",
      },
      { type: "h2", text: "Import the repository" },
      {
        type: "ol",
        items: [
          "Open the dashboard and choose **New project**.",
          "Pick the repository. Deplogram detects the framework and suggests build settings.",
          "Add any environment variables your app needs.",
          "Select **Deploy**.",
        ],
      },
      { type: "h2", text: "Watch the build" },
      {
        type: "code",
        title: "Build log",
        code: `→ detected Next.js · bun
→ installing dependencies…
→ build completed
→ ssl certificate issued
✓ Live at https://myapp.dpl.app`,
      },
      { type: "h2", text: "Ship a change" },
      {
        type: "p",
        text: "Push a commit to your production branch. Deplogram rebuilds and deploys automatically. Open a pull request instead and you get a preview URL.",
      },
      { type: "code", title: "Terminal", code: 'git commit -am "Update hero copy"\ngit push origin main' },
      { type: "h2", text: "Roll back" },
      {
        type: "p",
        text: "If something looks wrong, open the deployment history and promote any previous deployment. It's live again in seconds, with no rebuild.",
      },
    ],
  },
]

export function getDocPage(slug: string): DocPage | undefined {
  return docPages.find((page) => page.slug === slug)
}
