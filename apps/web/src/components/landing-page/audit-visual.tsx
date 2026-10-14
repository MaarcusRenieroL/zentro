import { Thread, ThreadItem } from "@zentro/ui/components/thread";

import { Reveal } from "./reveal";
import { Section } from "./section";

const events = [
  {
    who: "Priya",
    what: "changed the role of Jamal to",
    target: "Viewer plus comment",
    when: "2 min ago",
  },
  {
    who: "Daniel",
    what: "turned off the module",
    target: "Docs",
    when: "1 h ago",
  },
  {
    who: "Tomas",
    what: "moved WEB-12 to",
    target: "In review",
    when: "Yesterday",
  },
  {
    who: "Meilin",
    what: "invited",
    target: "ravi@example.com",
    when: "Yesterday",
  },
];

export function AuditVisual() {
  return (
    <Section
      id="audit"
      eyebrow="Audit log"
      title="Every change, with a name and a time"
      lead="Every mutation is recorded as it happens, in the same transaction as the change. Filter it, open an entry for the details, and export it."
      className="bg-sunken/60"
    >
      <Reveal className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-surface p-6 shadow-md ring-1 ring-hairline/60 sm:p-8">
          <Thread>
            {events.map((event) => (
              <ThreadItem key={event.what + event.when}>
                <p className="text-sm text-ink">
                  <span className="font-semibold">{event.who}</span>{" "}
                  <span className="text-ink-2">{event.what}</span>{" "}
                  <span className="rounded-md bg-sunken px-1.5 py-0.5 font-medium">
                    {event.target}
                  </span>
                </p>
                <p className="text-xs text-ink-3">{event.when}</p>
              </ThreadItem>
            ))}
          </Thread>
        </div>
      </Reveal>
    </Section>
  );
}
