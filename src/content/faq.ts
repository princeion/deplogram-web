export type FaqItem = {
  question: string
  answer: string
}

// TODO: confirm answers with the team before launch — especially anything about billing.
export const pricingFaq: readonly FaqItem[] = [
  {
    question: "Is Deplogram really free to start?",
    answer:
      "Yes. Freebies includes the core APIs with a monthly quota, every developer utility, limited test deployments on myapp.dpl.app, a small storage allowance, API keys and a usage dashboard.",
  },
  {
    question: "What happens when I go past my API quota?",
    answer:
      "The API keeps working and additional usage is billed per 1,000 requests. Rates are tied to what each service costs to run — SMS, for example, depends on carrier costs — and are shown per API in your dashboard.",
  },
  {
    question: "What's the difference between a test deployment and a persistent one?",
    answer:
      "Test deployments are for trying your app on a myapp.dpl.app address with basic logs. Plus adds longer-running and private deployments; Pro adds persistent, production-oriented deployments with larger resources, background jobs, cron and advanced logs.",
  },
  {
    question: "Is Deplogram a web host?",
    answer:
      "Not in the traditional sense — there's no cPanel, WordPress or email hosting. Deplogram is a developer platform: APIs, utilities, storage, domains and app deployments from one account.",
  },
  {
    question: "Is my stored data safe when I redeploy?",
    answer:
      "Yes. Storage is a separate product that lives apart from your app's containers, so restarts and redeploys never touch your files, assets or backups.",
  },
  {
    question: "Can I buy a domain through Deplogram?",
    answer:
      "Yes — search, buy and manage domains from the dashboard and connect them to any deployment. Domains are billed separately from your plan, and your free myapp.dpl.app address stays.",
  },
  {
    question: "What can I deploy?",
    answer:
      "Eight runtimes: Node.js, Next.js, Vite (React, Vue, Svelte), Python (FastAPI, Flask), PHP (Laravel), Go, static sites and Docker. If it runs in a container, it runs on Deplogram.",
  },
  {
    question: "Are prices in naira?",
    answer: "Yes. Plans are priced in naira (₦), and Deplogram is built with Nigerian and African developers in mind.",
  },
]
