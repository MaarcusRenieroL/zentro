import { Avatar, AvatarFallback } from "@zentro/ui/shadcn/avatar";
import { Badge } from "@zentro/ui/shadcn/badge";
import { Button } from "@zentro/ui/shadcn/button";
import { Textarea } from "@zentro/ui/shadcn/textarea";
import { CheckIcon, MessageSquareIcon } from "lucide-react";

const comments = [
  {
    id: 1,
    author: "Maya",
    fallback: "MR",
    text: "Can we link this endpoint to the auth task before publishing?",
    time: "12 min ago",
  },
  {
    id: 2,
    author: "Sanjay",
    fallback: "SG",
    text: "The error response section needs one concrete example.",
    time: "1 hour ago",
  },
];

export function CommentsPanel() {
  return (
    <aside className="hidden w-84 shrink-0 border-l bg-muted/20 xl:block">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4" />
          <p className="text-sm font-semibold">Comments</p>
        </div>
        <Badge variant="secondary">{comments.length} open</Badge>
      </div>

      <div className="space-y-3 p-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback>{comment.fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{comment.author}</p>
                <p className="text-xs text-muted-foreground">{comment.time}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{comment.text}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm">
                Reply
              </Button>
              <Button variant="ghost" size="sm">
                <CheckIcon className="size-4" />
                Resolve
              </Button>
            </div>
          </div>
        ))}

        <div className="rounded-lg border bg-background p-3">
          <Textarea placeholder="Add a comment..." />
          <Button className="mt-2 w-full" size="sm">
            Comment
          </Button>
        </div>
      </div>
    </aside>
  );
}
