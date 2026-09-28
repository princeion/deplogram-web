// TODO: the story copy is a placeholder draft — replace with the founders' own words.
export const aboutCopy = {
  header: {
    eyebrow: "About",
    title: "We're building the platform we kept wishing existed.",
    description:
      "Deplogram is a developer platform operated by REKTINA. It exists so developers can build, test, deploy, store and connect without assembling five vendors first.",
  },
  story: {
    eyebrow: "Our story",
    title: "The infrastructure you keep rebuilding, in one place.",
    paragraphs: [
      "Shipping a modern app usually means a hosting provider, an auth service, an email vendor, an SMS gateway, a cron runner and a pile of glue code — each with its own dashboard, keys and bill. For developers in Nigeria and across Africa, add payment friction and SMS delivery that works everywhere except where your users are.",
      "Deplogram puts APIs, developer utilities, storage, domains and app deployments behind one account. Send an OTP, decode a JWT, test your app on myapp.dpl.app, keep its files safe and connect a domain — without a new vendor for each.",
      "We're deliberately not a traditional web host: no cPanel, WordPress or email hosting. We'd rather own the developer workflow — discover a utility, use an API, deploy, store, connect a domain and scale usage — and do it well.",
    ],
    mission:
      "Our mission: make shipping software from Africa as easy as it is from anywhere — then make it easier.",
  },
  values: {
    eyebrow: "What we value",
    title: "How we build",
    description: "The principles behind the product, and behind how we work.",
  },
  team: {
    eyebrow: "Team",
    title: "The people behind Deplogram",
    description: "A small team of engineers who have shipped, broken and fixed a lot of production systems.",
  },
  cta: {
    title: "Want to build this with us?",
    description: "We're hiring engineers who care about developer experience as much as uptime.",
  },
} as const
