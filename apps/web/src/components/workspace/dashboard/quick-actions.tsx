import { Button } from "@zentro/ui/components/shadcn/button";
import {
  CalendarIcon,
  CheckSquareIcon,
  FileIcon,
  MessageSquareIcon,
} from "lucide-react";
import { FC } from "react";

const actions = [
  { label: "New task", icon: CheckSquareIcon, className: "text-purple-500" },
  { label: "New doc", icon: FileIcon, className: "text-blue-500" },
  { label: "Start chat", icon: MessageSquareIcon, className: "text-green-500" },
  {
    label: "Schedule meeting",
    icon: CalendarIcon,
    className: "text-orange-500",
  },
];

export const QuickActions: FC = () => {
  return (
    <section className="rounded-md border bg-card/50 p-5 shadow-sm">
      <h2 className="text-base font-medium">Quick actions</h2>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            size="lg"
            className="h-12 justify-start gap-2 rounded-md border bg-background/60 px-3 font-normal text-foreground hover:bg-secondary/70"
          >
            <action.icon className={`size-4 ${action.className}`} />
            <span className="truncate">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
};
