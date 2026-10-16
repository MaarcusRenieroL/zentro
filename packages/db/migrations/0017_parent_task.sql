ALTER TABLE "task" ADD COLUMN "parentTaskId" uuid;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_parentTaskId_task_id_fk" FOREIGN KEY ("parentTaskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_parent_task_idx" ON "task" USING btree ("parentTaskId");
