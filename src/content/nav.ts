import type { NavGroup, NavLink } from "@/content/types"

export const productMenu: readonly NavLink[] = [
  {
    label: "Deploy",
    href: "/deploy",
    description: "Source → runtime → configure → deploy → live.",
    icon: "rocket",
  },
  {
    label: "Runtimes",
    href: "/runtimes",
    description: "Vite, Next.js, Node.js, Python, PHP, Go, Static Sites, Docker.",
    icon: "layers",
  },
  {
    label: "Your Galley",
    href: "/#galley",
    description: "One workspace for projects and deployments.",
    icon: "layout",
  },
  {
    label: "CodePad",
    href: "/codepad",
    description: "A familiar editor. Run, save, preview, deploy.",
    icon: "code",
  },
  {
    label: "Storage",
    href: "/storage",
    description: "Files and folders, right beside your projects.",
    icon: "database",
  },
  {
    label: "Utilities & APIs",
    href: "/tools",
    description: "Six utilities and four APIs, one key.",
    icon: "wrench",
  },
]

export const mainNav: readonly NavLink[] = [
  { label: "Roadmap", href: "/roadmap" },
  { label: "Blog", href: "/blog" },
]

export const footerNav: readonly NavGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Deploy", href: "/deploy" },
      { label: "Runtimes", href: "/runtimes" },
      { label: "CodePad", href: "/codepad" },
      { label: "Storage", href: "/storage" },
      { label: "Utilities & APIs", href: "/tools" },
    ],
  },
  {
    title: "Early access",
    links: [
      { label: "Join the waitlist", href: "/waitlist" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
    ],
  },
]
