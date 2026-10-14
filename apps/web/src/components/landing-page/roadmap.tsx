import { Section } from "./section";
import { Reveal } from "./reveal";

const coming = [
  "Command palette",
  "Notifications by email",
  "Task dependencies",
  "Import from other tools",
];

export function Roadmap() {
  return (
    <Section
      id="roadmap"
      eyebrow="Coming"
      title="What we are building next"
      lead="Not shipped yet, so we are saying so."
    >
      <Reveal className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
        {coming.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink-2"
          >
            <span className="size-1.5 rounded-full bg-signal" />
            {item}
          </span>
        ))}
      </Reveal>
    </Section>
  );
}
