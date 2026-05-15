import { Blocks, Database, Users2, Puzzle } from "lucide-react";
import { FC } from "react";

const features = [
  {
    icon: Blocks,
    title: "Modular Apps",
    description:
      "Tasks, docs, whiteboards, and more. Use only what you need, when you need it. Each module is powerful on its own.",
  },
  {
    icon: Database,
    title: "Shared Data Layer",
    description:
      "All your data lives in one place. Reference tasks in docs, link conversations to projects — everything is connected.",
  },
  {
    icon: Users2,
    title: "Real-time Collaboration",
    description:
      "Work together seamlessly with presence indicators, live cursors, and instant updates across all modules.",
  },
  {
    icon: Puzzle,
    title: "Unified Workspace",
    description:
      "One login, one interface, one source of truth. No more juggling between different apps and contexts.",
  },
];

export const Features: FC = () => {
  return (
    <section id="features" className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built for the way teams actually work
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Every feature is designed to reduce friction and keep your team in
            flow.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/60 bg-card/30 p-6 transition-colors hover:border-border hover:bg-card/50 md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
