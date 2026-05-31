import type { WorkLogEvent, WorkspaceTask } from "./types";

export type Period = "week" | "2-weeks" | "3-weeks";

export type PlannerDay = {
  label: string;
  date: string;
  capacity: number;
  logged: number;
};

export type PlannerAssignment = {
  id: string;
  taskId: string;
  title: string;
  assignee: string;
  projectName: string;
  dayIndex: number;
  span: number;
  plannedHours: number;
  status: string;
};

export type LoggedHoursRow = {
  id: string;
  date: string;
  task: string;
  project: string;
  category: string;
  duration: string;
  comment: string;
};

export const plannerDays: PlannerDay[] = [
  { label: "Mon", date: "Jun 1", capacity: 8, logged: 6 },
  { label: "Tue", date: "Jun 2", capacity: 8, logged: 7.5 },
  { label: "Wed", date: "Jun 3", capacity: 8, logged: 3 },
  { label: "Thu", date: "Jun 4", capacity: 8, logged: 4 },
  { label: "Fri", date: "Jun 5", capacity: 8, logged: 1 },
  { label: "Sat", date: "Jun 6", capacity: 0, logged: 0 },
  { label: "Sun", date: "Jun 7", capacity: 0, logged: 0 },
  { label: "Mon", date: "Jun 8", capacity: 8, logged: 2 },
  { label: "Tue", date: "Jun 9", capacity: 8, logged: 0 },
  { label: "Wed", date: "Jun 10", capacity: 8, logged: 0 },
  { label: "Thu", date: "Jun 11", capacity: 8, logged: 0 },
  { label: "Fri", date: "Jun 12", capacity: 8, logged: 0 },
  { label: "Sat", date: "Jun 13", capacity: 0, logged: 0 },
  { label: "Sun", date: "Jun 14", capacity: 0, logged: 0 },
  { label: "Mon", date: "Jun 15", capacity: 8, logged: 0 },
  { label: "Tue", date: "Jun 16", capacity: 8, logged: 0 },
  { label: "Wed", date: "Jun 17", capacity: 8, logged: 0 },
  { label: "Thu", date: "Jun 18", capacity: 8, logged: 0 },
  { label: "Fri", date: "Jun 19", capacity: 8, logged: 0 },
  { label: "Sat", date: "Jun 20", capacity: 0, logged: 0 },
  { label: "Sun", date: "Jun 21", capacity: 0, logged: 0 },
];

export function getVisibleDays(period: Period) {
  if (period === "week") return plannerDays.slice(0, 7);
  if (period === "2-weeks") return plannerDays.slice(0, 14);

  return plannerDays;
}

export function getAssignments(
  tasks: WorkspaceTask[],
  visibleDays: PlannerDay[],
) {
  return tasks.slice(0, 8).map<PlannerAssignment>((task, index) => ({
    id: `${task.id}-${index}`,
    taskId: task.id,
    title: task.title,
    assignee: task.assignee,
    projectName: task.projectName,
    dayIndex: index % Math.max(visibleDays.length - 2, 1),
    span: index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 1,
    plannedHours: index % 3 === 0 ? 12 : index % 2 === 0 ? 8 : 3,
    status: task.status,
  }));
}

export function getLoggedRows(logs: WorkLogEvent[]): LoggedHoursRow[] {
  return logs.map((log, index) => ({
    id: log.id,
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    task: `${log.taskId} ${log.taskTitle}`,
    project: log.projectName,
    category: index % 2 === 0 ? "Billable" : "Non-billable",
    duration: log.duration,
    comment: log.note,
  }));
}
