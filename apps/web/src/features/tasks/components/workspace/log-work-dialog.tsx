import { ClockIcon } from "lucide-react";

import { Button } from "@zentro/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@zentro/ui/shadcn/dialog";
import { Input } from "@zentro/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zentro/ui/shadcn/select";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { WorkspaceTask } from "~/src/features/tasks/lib/types";
import { FC } from "react";

type Props = {
  tasks: WorkspaceTask[];
};

export const LogWorkDialog: FC<Props> = ({ tasks }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <ClockIcon className="size-4" />
          Log work
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Log work</DialogTitle>
          <DialogDescription>
            Add time spent to a task for the selected period.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Task</label>
            <Select defaultValue={tasks[0]?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.id} · {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" defaultValue="2026-06-03" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Time spent</label>
              <Input placeholder="1h 30m" defaultValue="1h" />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Category</label>
            <Select defaultValue="billable">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billable">Billable</SelectItem>
                <SelectItem value="non-billable">Non-billable</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Work description</label>
            <Textarea placeholder="What did you work on?" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save work log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
