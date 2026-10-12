import type { ContentBlock } from "@/content/types"

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  /** ISO date, YYYY-MM-DD */
  date: string
  author: string
  readingTime: string
  tag: string
  blocks: readonly ContentBlock[]
}

// TODO: drafts written from the product brief — have the team review before publishing.
export const posts: readonly BlogPost[] = [
  {
    slug: "introducing-deplogram",
    title: "Introducing Deplogram: a lightweight developer cloud",
    excerpt:
      "Deployment at the core, a compact kit around it, and nothing you'll have to ignore. Here's what we're building and why.",
    date: "2026-10-10",
    author: "The Deplogram team",
    readingTime: "4 min read",
    tag: "Announcement",
    blocks: [
      {
        type: "p",
        text: "Deplogram is a lightweight developer cloud. It's built to take you from code to a working deployment with as little friction as possible — and to give you a small, useful set of tools around that workflow.",
      },
      { type: "h2", text: "What's in the first release" },
      {
        type: "ul",
        items: [
          "Deployment across eight runtimes: Vite, Next.js, Node.js, Python, PHP, Go, Static Sites and Docker.",
          "Your Galley — one workspace for projects, deployments, code, storage, utilities and APIs.",
          "CodePad — a familiar editor where you can run, save, preview and deploy.",
          "Storage — simple file and object storage beside your projects.",
          "Six utilities and four APIs, chosen for the jobs you do every week.",
        ],
      },
      { type: "h2", text: "What we left out, on purpose" },
      {
        type: "p",
        text: "We're not trying to be a hyperscale cloud. Domains aren't in the first release. We cut the utilities and APIs down from an earlier, longer list. And we're not adding a ninth runtime until the first eight are dependable.",
      },
      {
        type: "callout",
        title: "Opening in waves",
        text: "Deplogram is in development. Join the waitlist and we'll email you when your invite is ready.",
      },
    ],
  },
  {
    slug: "build-time-vs-run-time",
    title: "A build that passed isn't an app that runs",
    excerpt: "Build time, run time, and the deployment states that tell you which one went wrong.",
    date: "2026-10-01",
    author: "The Deplogram team",
    readingTime: "5 min read",
    tag: "Engineering",
    blocks: [
      {
        type: "p",
        text: "A green build is satisfying. It's also not the finish line. The build turns your repository into something runnable; the run is whether that something actually starts, stays healthy and serves traffic.",
      },
      { type: "h2", text: "Build time" },
      {
        type: "p",
        text: "Dependency installation, compilation, framework builds and artifact generation. If this fails, you get `BUILD_FAILED` and the logs that explain it.",
      },
      { type: "h2", text: "Run time" },
      {
        type: "p",
        text: "The persistent process or container, its CPU and memory, storage and network behaviour. If the rollout fails you'll see `DEPLOY_FAILED`; if a running app falls over, `CRASHED`.",
      },
      {
        type: "code",
        title: "Deployment lifecycle",
        code: `QUEUED → BUILDING → BUILT → DEPLOYING → RUNNING

BUILDING  ✕ BUILD_FAILED
DEPLOYING ✕ DEPLOY_FAILED
RUNNING   ✕ CRASHED`,
      },
      {
        type: "p",
        text: "Separating these states means the deploy screen can stay simple while still telling you the truth about what happened.",
      },
    ],
  },
]

export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}
