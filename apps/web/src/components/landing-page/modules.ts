import {
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckSquareIcon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  LifeBuoyIcon,
  MailIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  PenToolIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  UsersRoundIcon,
  VideoIcon,
  WalletIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

import type { TileTint } from "@zentro/ui/components/tile";

export type LandingModule = {
  name: string;
  line: string;
  group: "Work" | "Knowledge" | "Talk" | "Company";
  /** True only for what exists in the product today. */
  live: boolean;
  tint: TileTint;
  icon: LucideIcon;
};

// `live` follows the module registry and the code: Projects, Tasks and Docs
// are modules; Teams, Roles, Activity and Administration live in organization
// settings; comments exist on tasks and docs. Everything else is planned.
export const landingModules: LandingModule[] = [
  {
    name: "Projects",
    line: "Plan work by project, with a key and a progress bar.",
    group: "Work",
    live: true,
    tint: "projects",
    icon: FolderIcon,
  },
  {
    name: "Tasks",
    line: "Start the next task, track state, see who is on what.",
    group: "Work",
    live: true,
    tint: "tasks",
    icon: CheckSquareIcon,
  },
  {
    name: "Teams",
    line: "Group people, give a team its own roles.",
    group: "Work",
    live: true,
    tint: "teams",
    icon: UsersRoundIcon,
  },
  {
    name: "Whiteboards",
    line: "Sketch an idea together before it is a task.",
    group: "Work",
    live: false,
    tint: "sun",
    icon: PenToolIcon,
  },
  {
    name: "Forms and workflows",
    line: "Collect requests and route them automatically.",
    group: "Work",
    live: false,
    tint: "lilac",
    icon: WorkflowIcon,
  },

  {
    name: "Docs",
    line: "Write beside the work, with a six-action editor.",
    group: "Knowledge",
    live: true,
    tint: "docs",
    icon: BookOpenIcon,
  },
  {
    name: "Files",
    line: "One place for files, linked to the task they belong to.",
    group: "Knowledge",
    live: false,
    tint: "sun",
    icon: FileTextIcon,
  },
  {
    name: "Comments",
    line: "Discuss on the task or the doc, not in a side channel.",
    group: "Knowledge",
    live: true,
    tint: "lilac",
    icon: MessageSquareIcon,
  },
  {
    name: "Learning",
    line: "Courses and onboarding for the team.",
    group: "Knowledge",
    live: false,
    tint: "teams",
    icon: GraduationCapIcon,
  },

  {
    name: "Chat",
    line: "Channels and direct messages next to the work.",
    group: "Talk",
    live: false,
    tint: "lilac",
    icon: MessagesSquareIcon,
  },
  {
    name: "Meetings and calls",
    line: "Start a call from the task that needs it.",
    group: "Talk",
    live: false,
    tint: "projects",
    icon: VideoIcon,
  },
  {
    name: "Mail",
    line: "Company mail that links to tasks and docs.",
    group: "Talk",
    live: false,
    tint: "docs",
    icon: MailIcon,
  },
  {
    name: "Calendar",
    line: "One calendar for meetings, due dates and leave.",
    group: "Talk",
    live: false,
    tint: "teams",
    icon: CalendarIcon,
  },
  {
    name: "Notifications",
    line: "Only the updates that need you.",
    group: "Talk",
    live: false,
    tint: "sun",
    icon: BellIcon,
  },

  {
    name: "HR",
    line: "People records, time off and onboarding.",
    group: "Company",
    live: false,
    tint: "teams",
    icon: UsersIcon,
  },
  {
    name: "Payroll",
    line: "Pay people from the same records.",
    group: "Company",
    live: false,
    tint: "sun",
    icon: WalletIcon,
  },
  {
    name: "Tickets and support",
    line: "Turn customer questions into tracked work.",
    group: "Company",
    live: false,
    tint: "lilac",
    icon: LifeBuoyIcon,
  },
  {
    name: "Dashboards and analytics",
    line: "Charts across every module.",
    group: "Company",
    live: false,
    tint: "projects",
    icon: BarChart3Icon,
  },
  {
    name: "Roles and permissions",
    line: "Build roles down to a single project.",
    group: "Company",
    live: true,
    tint: "audit",
    icon: ShieldIcon,
  },
  {
    name: "Activity and audit log",
    line: "Every change recorded, filterable, exportable.",
    group: "Company",
    live: true,
    tint: "audit",
    icon: ScrollTextIcon,
  },
  {
    name: "Administration",
    line: "Members, invitations and which modules are on.",
    group: "Company",
    live: true,
    tint: "slate",
    icon: SettingsIcon,
  },
];

export const moduleGroups = ["Work", "Knowledge", "Talk", "Company"] as const;

export const replaces: Record<(typeof moduleGroups)[number], string> = {
  Work: "Instead of a separate task tracker, a whiteboard app and a form builder",
  Knowledge: "Instead of a wiki, a shared drive and a training platform",
  Talk: "Instead of a chat app, a video-call tool, a mail client and a calendar",
  Company:
    "Instead of an HR system, a payroll tool, a help desk and a stack of dashboards",
};
