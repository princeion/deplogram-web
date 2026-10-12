import {
  Activity,
  Archive,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Binary,
  Braces,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock,
  Code,
  Container,
  Cpu,
  Database,
  Eye,
  Feather,
  File,
  FileArchive,
  FileCode,
  FileText,
  Fingerprint,
  Folder,
  FolderPlus,
  Gauge,
  GitBranch,
  Hammer,
  Handshake,
  HeartPulse,
  Hexagon,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  Menu,
  Minus,
  Moon,
  Network,
  Package,
  Play,
  Plug,
  Plus,
  QrCode,
  Regex,
  Rocket,
  Save,
  ScanSearch,
  ScrollText,
  Search,
  Server,
  Settings,
  Sparkles,
  Sun,
  Terminal,
  Trash,
  Triangle,
  Upload,
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
  activity: Activity,
  archive: Archive,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-up-down": ArrowUpDown,
  "arrow-up-right": ArrowUpRight,
  binary: Binary,
  braces: Braces,
  "calendar-clock": CalendarClock,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "circle-alert": CircleAlert,
  "circle-x": CircleX,
  clock: Clock,
  code: Code,
  container: Container,
  cpu: Cpu,
  database: Database,
  eye: Eye,
  feather: Feather,
  file: File,
  "file-archive": FileArchive,
  "file-code": FileCode,
  "file-text": FileText,
  fingerprint: Fingerprint,
  folder: Folder,
  "folder-plus": FolderPlus,
  gauge: Gauge,
  "git-branch": GitBranch,
  hammer: Hammer,
  handshake: Handshake,
  "heart-pulse": HeartPulse,
  hexagon: Hexagon,
  image: ImageIcon,
  "key-round": KeyRound,
  layers: Layers,
  layout: LayoutDashboard,
  loader: LoaderCircle,
  mail: Mail,
  menu: Menu,
  minus: Minus,
  moon: Moon,
  network: Network,
  package: Package,
  play: Play,
  plug: Plug,
  plus: Plus,
  "qr-code": QrCode,
  regex: Regex,
  rocket: Rocket,
  save: Save,
  "scan-search": ScanSearch,
  "scroll-text": ScrollText,
  search: Search,
  server: Server,
  settings: Settings,
  sparkles: Sparkles,
  sun: Sun,
  terminal: Terminal,
  trash: Trash,
  triangle: Triangle,
  upload: Upload,
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
