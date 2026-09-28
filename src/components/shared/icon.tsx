import {
  ArrowRight,
  Archive,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Binary,
  BookOpen,
  Building2,
  Boxes,
  Braces,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Code,
  Coffee,
  Container,
  Database,
  Eye,
  FileCode,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  Hash,
  HeartPulse,
  Hexagon,
  History,
  Image as ImageIcon,
  KeyRound,
  Laptop,
  Layers,
  Leaf,
  Link2,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Minus,
  Moon,
  Network,
  Plug,
  QrCode,
  RefreshCw,
  Regex,
  RotateCcw,
  ScanSearch,
  ScrollText,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Timer,
  TrendingUp,
  Users,
  Variable,
  Webhook,
  Workflow,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Icon registry. Content files reference icons by these string names so data stays serialisable
 * across the Server → Client boundary. Add an entry here before using a new icon.
 */
const icons = {
  "arrow-right": ArrowRight,
  archive: Archive,
  "arrow-up-right": ArrowUpRight,
  "badge-check": BadgeCheck,
  bell: Bell,
  binary: Binary,
  "book-open": BookOpen,
  building: Building2,
  boxes: Boxes,
  braces: Braces,
  "calendar-clock": CalendarClock,
  check: Check,
  "chevron-right": ChevronRight,
  clock: Clock,
  code: Code,
  coffee: Coffee,
  container: Container,
  database: Database,
  eye: Eye,
  "file-code": FileCode,
  "file-text": FileText,
  fingerprint: Fingerprint,
  gauge: Gauge,
  "git-branch": GitBranch,
  globe: Globe,
  "graduation-cap": GraduationCap,
  handshake: Handshake,
  "hard-drive": HardDrive,
  hash: Hash,
  "heart-pulse": HeartPulse,
  hexagon: Hexagon,
  history: History,
  image: ImageIcon,
  "key-round": KeyRound,
  laptop: Laptop,
  layers: Layers,
  leaf: Leaf,
  link: Link2,
  "list-checks": ListChecks,
  lock: Lock,
  mail: Mail,
  "map-pin": MapPin,
  menu: Menu,
  message: MessageSquareText,
  minus: Minus,
  moon: Moon,
  network: Network,
  plug: Plug,
  "qr-code": QrCode,
  "refresh-cw": RefreshCw,
  regex: Regex,
  "rotate-ccw": RotateCcw,
  "scan-search": ScanSearch,
  "scroll-text": ScrollText,
  search: Search,
  send: Send,
  server: Server,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  sun: Sun,
  terminal: Terminal,
  timer: Timer,
  "trending-up": TrendingUp,
  users: Users,
  variable: Variable,
  webhook: Webhook,
  workflow: Workflow,
  wrench: Wrench,
  x: X,
  zap: Zap,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof icons

const sizes = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const

type IconProps = {
  name: IconName
  size?: keyof typeof sizes
  className?: string
  /** Provide for meaningful icons; omitted → decorative (aria-hidden). */
  label?: string
}

/** Consistent lucide wrapper: fixed size scale + stroke width. */
export function Icon({ name, size = "sm", className, label }: IconProps) {
  const Component = icons[name]
  return (
    <Component
      className={cn(sizes[size], "shrink-0", className)}
      strokeWidth={1.75}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  )
}
