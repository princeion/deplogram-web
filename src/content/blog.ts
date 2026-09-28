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

// TODO: placeholder posts — replace with real articles (and add cover images via next/image) before launch.
export const posts: readonly BlogPost[] = [
  {
    slug: "preview-deployments-explained",
    title: "How preview deployments work on Deplogram",
    excerpt:
      "Every pull request gets its own URL. Here's what happens between opening a PR and sharing a link with your reviewer.",
    date: "2026-09-18",
    author: "Deplogram Team",
    readingTime: "4 min read",
    tag: "Product",
    blocks: [
      {
        type: "p",
        text: "Reviewing a screenshot of a change is not the same as clicking through it. Preview deployments give every pull request a real, shareable URL that updates on every push.",
      },
      { type: "h2", text: "What happens when you open a pull request" },
      {
        type: "ol",
        items: [
          "GitHub notifies Deplogram that a pull request was opened against a connected repo.",
          "We build the branch exactly as we would build production — same framework detection, same build command.",
          "The build is deployed to a unique URL and posted back to the pull request as a check.",
          "Every new push to the branch rebuilds and updates the same URL.",
        ],
      },
      { type: "h2", text: "Environment variables for previews" },
      {
        type: "p",
        text: "Previews use their own environment scope, so you can point them at a staging database without touching production. Variables you mark as `production` only are never injected into preview builds.",
      },
      {
        type: "code",
        title: "Terminal",
        code: `dpl env add DATABASE_URL --scope preview
dpl env add DATABASE_URL --scope production`,
      },
      {
        type: "callout",
        title: "Cleaned up automatically",
        text: "When a pull request is merged or closed, its preview deployment is retired. Nothing to remember to tear down.",
      },
      { type: "h2", text: "When to reach for them" },
      {
        type: "ul",
        items: [
          "Design reviews where the details matter.",
          "QA on real devices before merging.",
          "Sharing work-in-progress with a client without giving them repo access.",
        ],
      },
    ],
  },
  {
    slug: "why-sms-is-a-first-class-api",
    title: "Why SMS is a first-class API on Deplogram",
    excerpt:
      "For a lot of users across Africa, the phone number is the identity. So OTP and transactional SMS are first-class APIs, not an add-on.",
    date: "2026-08-30",
    author: "Deplogram Team",
    readingTime: "5 min read",
    tag: "Engineering",
    blocks: [
      {
        type: "p",
        text: "When you build for users in Lagos, Nairobi or Accra, the phone number often matters more than the email address. Login codes, order updates and delivery notifications all arrive by SMS.",
      },
      { type: "h2", text: "The usual setup" },
      {
        type: "p",
        text: "Most teams stitch together a hosting provider, a separate SMS vendor, a separate email vendor and some glue code. Each one has its own dashboard, its own keys and its own bill.",
      },
      { type: "h2", text: "What we did instead" },
      {
        type: "p",
        text: "Deplogram ships SMS as a built-in API, next to OTP, Email, Notifications and Validation. Call it from any stack with your API key — or from a Deplogram deployment, where the key is already injected.",
      },
      {
        type: "code",
        title: "app/api/orders/route.ts",
        code: `import { sms } from "@deplogram/sdk"

await sms.send({
  to: order.customerPhone,
  body: \`Order #\${order.id} is on its way.\`,
})`,
      },
      {
        type: "callout",
        title: "Illustrative",
        text: "The SDK surface shown here is a preview and may change before general availability.",
      },
    ],
  },
  {
    slug: "introducing-deplogram",
    title: "Introducing Deplogram: developer infrastructure, APIs & utilities",
    excerpt:
      "APIs, developer utilities, storage, domains and app deployments from one account — built with African developers in mind.",
    date: "2026-09-10",
    author: "Deplogram Team",
    readingTime: "3 min read",
    tag: "Announcement",
    blocks: [
      {
        type: "p",
        text: "Deplogram gives developers the infrastructure and utilities they keep rebuilding, from one account. It is a developer platform, not a traditional web host.",
      },
      { type: "h2", text: "Five things in one" },
      {
        type: "ul",
        items: [
          "**APIs** — OTP, notifications, SMS, email, image processing, URL utilities, QR codes and validation.",
          "**Developer utilities** — JSON, JWT, Base64, hashing, regex, cron and webhook tools you can reach in seconds.",
          "**Deployments** — push from GitHub and test on `myapp.dpl.app`; upgrade for persistent apps.",
          "**Storage** — files, assets and backups that live apart from your containers.",
          "**Domains** — search, buy and connect a domain to any deployment.",
        ],
      },
      { type: "h2", text: "What's next" },
      {
        type: "p",
        text: "We're opening access in waves. Start on Freebies today — the core APIs, every utility and test deployments are free — and tell us what you'd like to see next.",
      },
    ],
  },
]

/** Newest first. */
export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}
