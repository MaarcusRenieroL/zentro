export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type HomeTask = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueLabel: string;
};

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  openTasks: number;
  dueSoon: number;
  progress: number;
};

export type StatusSummary = {
  id: TaskStatus;
  label: string;
  count: number;
  color: string;
};

export type PrioritySummary = {
  id: TaskPriority;
  label: string;
  count: number;
  color: string;
};

export type WorkTypeSummary = {
  id: string;
  label: string;
  count: number;
  color: string;
};

export const myTasks: HomeTask[] = [
  {
    id: "TSK-24",
    title: "Finalize task board interactions",
    project: "Launch OS",
    status: "in-progress",
    priority: "high",
    dueLabel: "Today",
  },
  {
    id: "TSK-18",
    title: "Write empty states for project tasks",
    project: "Design System",
    status: "todo",
    priority: "medium",
    dueLabel: "Tomorrow",
  },
  {
    id: "TSK-12",
    title: "Review calendar view spacing",
    project: "Planning",
    status: "review",
    priority: "medium",
    dueLabel: "Jun 3",
  },
  {
    id: "TSK-09",
    title: "Connect task filters to mock state",
    project: "Launch OS",
    status: "todo",
    priority: "low",
    dueLabel: "Jun 5",
  },
];

export const dueSoonTasks: HomeTask[] = [
  {
    id: "TSK-31",
    title: "Confirm assignment menu states",
    project: "Design System",
    status: "todo",
    priority: "high",
    dueLabel: "Today",
  },
  {
    id: "TSK-27",
    title: "Polish project task summary",
    project: "Launch OS",
    status: "in-progress",
    priority: "medium",
    dueLabel: "Tomorrow",
  },
  {
    id: "TSK-20",
    title: "Check mobile list density",
    project: "Planning",
    status: "todo",
    priority: "medium",
    dueLabel: "Jun 4",
  },
];

export const recentActivity: ActivityEvent[] = [
  {
    id: "ACT-1",
    actor: "Maarcus",
    action: "moved",
    target: "Finalize task board interactions",
    time: "12 min ago",
  },
  {
    id: "ACT-2",
    actor: "Anika",
    action: "commented on",
    target: "Review calendar view spacing",
    time: "34 min ago",
  },
  {
    id: "ACT-3",
    actor: "Dev",
    action: "created",
    target: "Connect task filters to mock state",
    time: "1 hr ago",
  },
  {
    id: "ACT-4",
    actor: "Maarcus",
    action: "assigned",
    target: "Confirm assignment menu states",
    time: "2 hrs ago",
  },
  {
    id: "ACT-5",
    actor: "Anika",
    action: "changed priority on",
    target: "Polish project task summary",
    time: "Yesterday",
  },
  {
    id: "ACT-6",
    actor: "Dev",
    action: "completed",
    target: "Write empty states for project tasks",
    time: "Yesterday",
  },
  {
    id: "ACT-7",
    actor: "Maarcus",
    action: "updated due date for",
    target: "Check mobile list density",
    time: "2 days ago",
  },
];

export const statusSummary: StatusSummary[] = [
  {
    id: "todo",
    label: "To Do",
    count: 3,
    color: "bg-slate-400",
  },
  {
    id: "in-progress",
    label: "In Progress",
    count: 2,
    color: "bg-blue-500",
  },
  {
    id: "review",
    label: "In Review",
    count: 1,
    color: "bg-amber-500",
  },
  {
    id: "done",
    label: "Done",
    count: 2,
    color: "bg-emerald-500",
  },
];

export const prioritySummary: PrioritySummary[] = [
  {
    id: "high",
    label: "High",
    count: 3,
    color: "bg-red-500",
  },
  {
    id: "medium",
    label: "Medium",
    count: 4,
    color: "bg-amber-500",
  },
  {
    id: "low",
    label: "Low",
    count: 1,
    color: "bg-slate-400",
  },
];

export const workTypeSummary: WorkTypeSummary[] = [
  {
    id: "task",
    label: "Task",
    count: 5,
    color: "bg-blue-500",
  },
  {
    id: "feature",
    label: "Feature",
    count: 2,
    color: "bg-purple-500",
  },
  {
    id: "bug",
    label: "Bug",
    count: 1,
    color: "bg-red-500",
  },
];
