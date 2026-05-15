import { Zap, Focus, Target } from "lucide-react";
import { FC } from "react";

const benefits = [
  {
    icon: Zap,
    title: "Faster workflows",
    description:
      "Eliminate time wasted switching between apps. Complete tasks in half the time with everything at your fingertips.",
    stat: "2x",
    statLabel: "faster task completion",
  },
  {
    icon: Focus,
    title: "Less context switching",
    description:
      "Stay focused on what matters. One unified interface means fewer distractions and deeper work sessions.",
    stat: "60%",
    statLabel: "fewer tool switches",
  },
  {
    icon: Target,
    title: "Better team alignment",
    description:
      "Everyone sees the same information. No more miscommunication or working from outdated data.",
    stat: "3x",
    statLabel: "improved visibility",
  },
];

export const Benefits: FC = () => {
  return (
    <section id="benefits" className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Results that matter
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Teams using Zentro see measurable improvements in productivity and
            collaboration.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative rounded-2xl border border-border/60 bg-card/30 p-6 transition-colors hover:border-border hover:bg-card/50 md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <benefit.icon className="h-5 w-5 text-foreground" />
              </div>

              <div className="mt-6">
                <span className="text-4xl font-semibold text-accent">
                  {benefit.stat}
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {benefit.statLabel}
                </p>
              </div>

              <h3 className="mt-6 text-lg font-medium text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
