export type FaqItem = {
  question: string
  answer: string
}

// TODO: confirm answers with the team before launch.
export const faq: readonly FaqItem[] = [
  {
    question: "Can I use Deplogram today?",
    answer:
      "Not yet. Deplogram is in active development and will open in waves. Join the waitlist and we'll email you when your invite is ready.",
  },
  {
    question: "What can I deploy?",
    answer:
      "Eight runtimes: Vite, Next.js, Node.js, Python, PHP, Go, Static Sites and Docker. Our focus is making these eight reliable before adding more — and Docker covers anything that runs in a container.",
  },
  {
    question: "What do I configure when I deploy?",
    answer:
      "Only what a deployment needs: project name, runtime version, build command, start command, port and environment variables. Builds, containers, routing, logs and health checks are handled by the platform.",
  },
  {
    question: "How will I know if a deployment fails?",
    answer:
      "Every deployment reports explicit states. A build problem shows as BUILD_FAILED, a rollout problem as DEPLOY_FAILED, and a running app that stops as CRASHED — each with the relevant logs.",
  },
  {
    question: "Is Deplogram a web host?",
    answer:
      "Not in the traditional sense. There's no cPanel or WordPress hosting. Deplogram is a developer cloud built around deployment, with a workspace, an editor, storage, utilities and APIs around it.",
  },
  {
    question: "Can I connect a custom domain?",
    answer: "Custom domains aren't part of the first release. Every deployment gets a Deplogram deployment URL.",
  },
]
