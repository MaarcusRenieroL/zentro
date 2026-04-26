const tools = [
  { name: "Jira", category: "Tasks" },
  { name: "Notion", category: "Docs" },
  { name: "Slack", category: "Chat" },
  { name: "Trello", category: "Boards" },
  { name: "Asana", category: "Projects" },
  { name: "Confluence", category: "Wiki" },
  { name: "Miro", category: "Whiteboard" },
  { name: "Monday", category: "Workflow" },
];

export const Problem = () => {
  return (
    <section className="border-t border-border/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Your team is drowning in tools
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            The average company uses 8+ different productivity tools. Context
            switching between them wastes hours every week and fragments your
            team&apos;s knowledge.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="group relative rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-border hover:bg-card md:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground md:text-base">
                  {tool.name}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground md:text-xs">
                  {tool.category}
                </span>
              </div>
              {/* Decorative disconnection line */}
              <div className="mt-4 h-px w-full bg-linear-to-r from-transparent via-destructive/30 to-transparent" />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive/80">40%</span> of work time is
            spent searching for information across tools
          </p>
        </div>
      </div>
    </section>
  );
};
