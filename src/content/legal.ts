import type { ContentBlock } from "@/content/types"

export type LegalDocument = {
  title: string
  description: string
  /** ISO date, YYYY-MM-DD */
  updated: string
  blocks: readonly ContentBlock[]
}

// TODO: placeholder text only — replace both documents with counsel-reviewed copy before launch.
const placeholderNotice: ContentBlock = {
  type: "callout",
  title: "Placeholder",
  text: "This document is a draft placeholder and is not legal advice. It will be replaced with reviewed terms before public launch.",
}

export const privacyPolicy: LegalDocument = {
  title: "Privacy policy",
  description: "How Deplogram collects, uses and protects information about you and your projects.",
  updated: "2026-10-12",
  blocks: [
    placeholderNotice,
    { type: "h2", text: "The waitlist" },
    {
      type: "p",
      text: "If you join the waitlist we keep your email address and any optional details you give us (such as your name, role and the runtimes you use), and use them only to send your early-access invite and to understand who Deplogram is for. Ask us and we will remove you.",
    },
    { type: "h2", text: "Information we collect" },
    {
      type: "p",
      text: "Deplogram is operated by REKTINA. We collect the information you give us when you create an account (such as your name, email address and GitHub username), and information generated when you use the service (such as deployment metadata, build logs and usage metrics).",
    },
    { type: "h2", text: "How we use information" },
    {
      type: "ul",
      items: [
        "To provide, operate and improve the service.",
        "To communicate with you about your account, deployments and security.",
        "To detect and prevent abuse, fraud and security incidents.",
      ],
    },
    { type: "h2", text: "Your code and data" },
    {
      type: "p",
      text: "Your source code and the data your applications process belong to you. We access them only to build, run and support your deployments, or when required by law.",
    },
    { type: "h2", text: "Sharing" },
    {
      type: "p",
      text: "We do not sell personal information. We share it only with service providers who help us run Deplogram, under agreements that require them to protect it.",
    },
    { type: "h2", text: "Your rights" },
    {
      type: "p",
      text: "Depending on where you live — including under the Nigeria Data Protection Act — you may have the right to access, correct, export or delete your personal information. Contact us to make a request.",
    },
    { type: "h2", text: "Contact" },
    { type: "p", text: "Questions about this policy can be sent to `hello@deplogram.app`." },
  ],
}

export const termsOfService: LegalDocument = {
  title: "Terms of service",
  description: "The rules for using Deplogram's deployments, workspace, CodePad, storage, utilities and APIs.",
  updated: "2026-10-12",
  blocks: [
    placeholderNotice,
    { type: "h2", text: "Using Deplogram" },
    {
      type: "p",
      text: "Deplogram is operated by REKTINA. By creating an account you agree to these terms. You must be old enough to form a binding contract and provide accurate account information.",
    },
    { type: "h2", text: "Acceptable use" },
    {
      type: "ul",
      items: [
        "Don't deploy content or services that are illegal, harmful or infringe others' rights.",
        "Don't use the service to send unsolicited messages, including through the Email and OTP APIs.",
        "Don't attempt to disrupt, probe or overload the platform or other customers' deployments.",
      ],
    },
    { type: "h2", text: "Your content" },
    {
      type: "p",
      text: "You keep all rights to the code and content you deploy. You grant us the limited permissions needed to host, build and serve it on your behalf.",
    },
    { type: "h2", text: "Early access and billing" },
    {
      type: "p",
      text: "Early access is provided as-is while the platform is in development. Any billing terms will be published before they apply to your account.",
    },
    { type: "h2", text: "Termination" },
    {
      type: "p",
      text: "You can close your account at any time. We may suspend accounts that violate these terms, with notice where reasonably possible.",
    },
    { type: "h2", text: "Changes" },
    {
      type: "p",
      text: "We'll notify you of material changes to these terms. Continuing to use the service after changes take effect means you accept them.",
    },
  ],
}
