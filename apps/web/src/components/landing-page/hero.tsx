import { Button } from "@zentro/ui/shadcn/button";
import { ArrowRight } from "lucide-react";
import { FC } from "react";

export const Hero: FC = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-xs font-medium text-muted-foreground">
            Now in public beta
          </span>
        </div>

        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          The operating system for your company
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Stop juggling between Jira, Notion, Slack, and a dozen other tools.
          Zentro brings everything your team needs into one unified platform.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-border/60 text-foreground hover:bg-secondary sm:w-auto"
          >
            Learn more
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Free for teams up to 10 members • No credit card required
        </p>
      </div>
    </section>
  );
};
