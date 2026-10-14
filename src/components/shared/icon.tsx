import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Activity01Icon,
  AlertCircleIcon,
  Agreement01Icon,
  Analytics01Icon,
  BookOpen01Icon,
  Comment01Icon,
  GithubIcon,
  HelpCircleIcon,
  Home01Icon,
  Logout01Icon,
  News01Icon,
  Notification01Icon,
  Shield01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Archive01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  BinaryCodeIcon,
  BracesIcon,
  Calendar03Icon,
  Cancel01Icon,
  CancelCircleIcon,
  Clock01Icon,
  CodeIcon,
  Copy01Icon,
  ComputerTerminal01Icon,
  ContainerIcon,
  CpuIcon,
  DashboardSpeed01Icon,
  DashboardSquare01Icon,
  Database01Icon,
  Delete02Icon,
  EyeIcon,
  FeatherIcon,
  File01Icon,
  File02Icon,
  FileScriptIcon,
  FileZipIcon,
  FingerPrintIcon,
  FlashIcon,
  FloppyDiskIcon,
  Folder01Icon,
  FolderAddIcon,
  GitBranchIcon,
  HammerIcon,
  HealtcareIcon,
  HexagonIcon,
  HierarchySquare01Icon,
  Image01Icon,
  Key01Icon,
  Layers01Icon,
  Link01Icon,
  Loading03Icon,
  Mail01Icon,
  Menu01Icon,
  MinusSignIcon,
  Moon02Icon,
  PackageIcon,
  PlayIcon,
  Plug01Icon,
  PlusSignIcon,
  QrCodeIcon,
  RegexIcon,
  Rocket01Icon,
  Scroll01Icon,
  Search01Icon,
  SearchFocusIcon,
  ServerStack01Icon,
  Settings01Icon,
  SparklesIcon,
  Sun03Icon,
  Tick02Icon,
  UnfoldMoreIcon,
  TriangleIcon,
  Upload01Icon,
  VariableIcon,
  WebhookIcon,
  WorkflowSquare01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

/**
 * Icon registry (Hugeicons, free set). Content files reference icons by these string names so data
 * stays serialisable across the Server → Client boundary. Add an entry here before using a new icon.
 */
const icons = {
  activity: Activity01Icon,
  analytics: Analytics01Icon,
  bell: Notification01Icon,
  book: BookOpen01Icon,
  github: GithubIcon,
  help: HelpCircleIcon,
  home: Home01Icon,
  logout: Logout01Icon,
  message: Comment01Icon,
  news: News01Icon,
  shield: Shield01Icon,
  user: UserCircleIcon,
  users: UserGroupIcon,
  archive: Archive01Icon,
  "arrow-left": ArrowLeft01Icon,
  "arrow-right": ArrowRight02Icon,
  "arrow-up": ArrowUp01Icon,
  "arrow-up-down": ArrowUpDownIcon,
  "arrow-up-right": ArrowUpRight01Icon,
  binary: BinaryCodeIcon,
  braces: BracesIcon,
  "calendar-clock": Calendar03Icon,
  check: Tick02Icon,
  "chevron-down": ArrowDown01Icon,
  "chevron-right": ArrowRight01Icon,
  "chevrons-up-down": UnfoldMoreIcon,
  "circle-alert": AlertCircleIcon,
  "circle-x": CancelCircleIcon,
  clock: Clock01Icon,
  code: CodeIcon,
  copy: Copy01Icon,
  container: ContainerIcon,
  cpu: CpuIcon,
  database: Database01Icon,
  eye: EyeIcon,
  feather: FeatherIcon,
  file: File01Icon,
  "file-archive": FileZipIcon,
  "file-code": FileScriptIcon,
  "file-text": File02Icon,
  fingerprint: FingerPrintIcon,
  folder: Folder01Icon,
  "folder-plus": FolderAddIcon,
  gauge: DashboardSpeed01Icon,
  "git-branch": GitBranchIcon,
  hammer: HammerIcon,
  handshake: Agreement01Icon,
  "heart-pulse": HealtcareIcon,
  hexagon: HexagonIcon,
  image: Image01Icon,
  "key-round": Key01Icon,
  layers: Layers01Icon,
  layout: DashboardSquare01Icon,
  link: Link01Icon,
  loader: Loading03Icon,
  mail: Mail01Icon,
  menu: Menu01Icon,
  minus: MinusSignIcon,
  moon: Moon02Icon,
  network: HierarchySquare01Icon,
  package: PackageIcon,
  play: PlayIcon,
  plug: Plug01Icon,
  plus: PlusSignIcon,
  "qr-code": QrCodeIcon,
  regex: RegexIcon,
  rocket: Rocket01Icon,
  save: FloppyDiskIcon,
  "scan-search": SearchFocusIcon,
  "scroll-text": Scroll01Icon,
  search: Search01Icon,
  server: ServerStack01Icon,
  settings: Settings01Icon,
  sparkles: SparklesIcon,
  sun: Sun03Icon,
  terminal: ComputerTerminal01Icon,
  trash: Delete02Icon,
  triangle: TriangleIcon,
  upload: Upload01Icon,
  variable: VariableIcon,
  webhook: WebhookIcon,
  workflow: WorkflowSquare01Icon,
  wrench: Wrench01Icon,
  x: Cancel01Icon,
  zap: FlashIcon,
} satisfies Record<string, IconSvgElement>

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
  /**
   * Filled look for selected states (active nav link). The free set is outline-only, so shapes get a
   * soft fill in the current colour — a full fill would erase inner details. True solid icons need
   * Hugeicons Pro (swap `icon` for the solid variant here).
   */
  filled?: boolean
}

/** Consistent Hugeicons wrapper: fixed size scale + stroke width, colour from `currentColor`. */
export function Icon({ name, size = "sm", className, label, filled = false }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      strokeWidth={1.5}
      {...(filled && { fill: "currentColor", fillOpacity: 0.3 })}
      className={cn(sizes[size], "shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  )
}
