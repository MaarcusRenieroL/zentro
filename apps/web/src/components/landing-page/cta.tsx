import { Button } from "@zentro/ui/shadcn/button";
import { ArrowRight } from "lucide-react";
import { FC } from "react";

export const CTA: FC = () => {
  return (
    <section className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-b from-secondary/80 to-card p-6 sm:p-8 md:p-16">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Ready to simplify how your team works?
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Join thousands of teams who&apos;ve replaced their cluttered
              toolstack with Zentro. Start free today.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              >
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-border/60 text-foreground hover:bg-secondary sm:w-auto"
              >
                Schedule a demo
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Free for teams up to 10 • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
