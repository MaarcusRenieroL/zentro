import {
  ArchiveIcon,
  BellIcon,
  BlocksIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GaugeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SettingsIcon,
  ShieldIcon,
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
