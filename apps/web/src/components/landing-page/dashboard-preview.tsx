import {
  FileText,
  CheckSquare,
  MessageSquare,
  Users,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { FC } from "react";

const sidebarItems = [
  { icon: Search, label: "Search", active: false },
  { icon: CheckSquare, label: "Tasks", active: true },
  { icon: FileText, label: "Docs", active: false },
  { icon: MessageSquare, label: "Messages", active: false },
  { icon: Users, label: "Team", active: false },
];

const tasks = [
  { title: "Design system updates", status: "In Progress", priority: "High" },
  { title: "API documentation", status: "Review", priority: "Medium" },
  { title: "User onboarding flow", status: "In Progress", priority: "High" },
  { title: "Performance audit", status: "Todo", priority: "Low" },
];

export const DashboardPreview: FC = () => {
  return (
    <section className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything in one place
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            A unified interface that brings all your tools together. No more tab
            chaos.
          </p>
        </div>

        <div className="mt-16">
          {/* Dashboard mockup */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 shadow-2xl shadow-black/20">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border/40 bg-secondary/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="ml-4 flex-1">
                <div className="mx-auto w-48 rounded-md bg-background/50 px-3 py-1 text-center text-xs text-muted-foreground">
                  app.zentro.io
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="hidden w-56 shrink-0 border-r border-border/40 bg-secondary/30 p-4 md:block">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
                    <span className="text-xs font-bold text-accent">Z</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Acme Inc
                  </span>
                </div>

                <div className="space-y-1">
                  {sidebarItems.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        item.active
                          ? "bg-accent/20 text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 mb-2">
                    Projects
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-secondary">
                      <div className="h-2 w-2 rounded-full bg-accent/60" />
                      Product Launch
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-secondary">
                      <div className="h-2 w-2 rounded-full bg-chart-2/60" />
                      Marketing Site
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      Tasks
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      4 active tasks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground">
                      <Bell className="h-4 w-4" />
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Task</span>
                    </button>
                  </div>
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg border border-border/40 bg-background/50 p-4 transition-colors hover:border-border"
                    >
                      <div className="h-4 w-4 rounded border border-border/60" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                      </div>
                      <span
                        className={`hidden sm:inline rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          task.status === "In Progress"
                            ? "bg-accent/20 text-accent"
                            : task.status === "Review"
                              ? "bg-chart-2/20 text-chart-2"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`hidden md:inline rounded-full px-2 py-0.5 text-[10px] ${
                          task.priority === "High"
                            ? "bg-destructive/20 text-destructive"
                            : task.priority === "Medium"
                              ? "bg-chart-4/20 text-chart-4"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
