import {
  FileText,
  MessageSquare,
  LayoutGrid,
  Users,
  Layers,
  Zap,
} from "lucide-react";
import { FC } from "react";

const modules = [
  { icon: LayoutGrid, name: "Tasks", description: "Plan and track work" },
  { icon: FileText, name: "Docs", description: "Write and share knowledge" },
  { icon: MessageSquare, name: "Chat", description: "Communicate in context" },
  { icon: Users, name: "Teams", description: "Organize your people" },
  { icon: Layers, name: "Projects", description: "Manage initiatives" },
  { icon: Zap, name: "Automations", description: "Streamline workflows" },
];

export const Solution: FC = () => {
  return (
    <section id="solution" className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              One platform. Everything connected.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Zentro replaces your scattered toolkit with a unified workspace
              where tasks, docs, and conversations live together. No more
              context switching.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border/60 hover:bg-card/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <module.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {module.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Unified platform visual */}
            <div className="relative rounded-2xl border border-border/60 bg-card/30 p-1">
              <div className="rounded-xl bg-linear-to-b from-secondary/80 to-card p-6">
                <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-accent/20">
                    <span className="text-[10px] font-bold text-accent">Z</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    zentro
                  </span>
                  <div className="ml-auto flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {["Tasks", "Docs", "Chat"].map((item, i) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg bg-background/50 p-3"
                      style={{ opacity: 1 - i * 0.15 }}
                    >
                      <div className="h-3 w-3 rounded bg-accent/40" />
                      <span className="text-xs text-muted-foreground">
                        {item}
                      </span>
                      <div className="ml-auto h-1.5 w-12 rounded-full bg-muted" />
                    </div>
                  ))}
                </div>

                {/* Connection lines */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-linera-to-r from-transparent to-accent/40" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
                    <Zap className="h-3 w-3 text-accent" />
                  </div>
                  <div className="h-px flex-1 bg-linear-to-l from-transparent to-accent/40" />
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  All data synced in real-time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
