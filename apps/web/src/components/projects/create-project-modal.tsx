import { Button } from "@zentro/ui/shadcn/button";
import { Label } from "@zentro/ui/shadcn/label";
import { Input } from "@zentro/ui/shadcn/input";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@zentro/ui/shadcn/dialog";
import { PlusIcon } from "lucide-react";

export const CreateProjectModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusIcon className="h-4 w-4" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Create a new project to organize work and collaborate with your
            team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Website Redesign"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              id="project-slug"
              placeholder="website-redesign"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of the project..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
