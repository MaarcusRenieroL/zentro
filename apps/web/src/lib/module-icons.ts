import {
  ArchiveIcon,
  AtSignIcon,
  BellIcon,
  BlocksIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartNoAxesColumnIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListChecksIcon,
  MessageSquareIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SquareCheckIcon,
  StarIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

// Manifests refer to icons by lucide name; only these are bundled.
const moduleIcons: Record<string, LucideIcon> = {
  Archive: ArchiveIcon,
  Bell: BellIcon,
  Blocks: BlocksIcon,
  BookOpen: BookOpenIcon,
  Calendar: CalendarIcon,
  CheckCircle2: CheckCircle2Icon,
  CreditCard: CreditCardIcon,
  FileText: FileTextIcon,
  Folder: FolderIcon,
  Gauge: GaugeIcon,
  Inbox: InboxIcon,
  LayoutDashboard: LayoutDashboardIcon,
  ListChecks: ListChecksIcon,
  MessageSquare: MessageSquareIcon,
  AtSign: AtSignIcon,
  Search: SearchIcon,
  ScrollText: ScrollTextIcon,
  Settings: SettingsIcon,
  Shield: ShieldIcon,
  Star: StarIcon,
  Trash2: Trash2Icon,
  UserPlus: UserPlusIcon,
  Users: UsersIcon,
};

export function getModuleIcon(name: string): LucideIcon {
  return moduleIcons[name] ?? BlocksIcon;
}

// The places in the sidebar have their own set, drawn for the app shell.
const shellIcons: Record<string, LucideIcon> = {
  dashboard: CircleDotIcon,
  tasks: SquareCheckIcon,
  projects: LayoutGridIcon,
  docs: FileTextIcon,
  chat: MessageSquareIcon,
  files: FolderIcon,
  calendar: CalendarIcon,
  team: UsersIcon,
  overview: ChartNoAxesColumnIcon,
  settings: SettingsIcon,
};

/** The icon of a sidebar place, falling back to its manifest icon. */
export function getShellIcon(id: string, name: string): LucideIcon {
  return shellIcons[id] ?? getModuleIcon(name);
}
