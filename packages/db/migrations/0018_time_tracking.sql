ALTER TABLE "task" ADD COLUMN "estimatePoints" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "timeSpentMinutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "taskTimeLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"taskId" uuid NOT NULL,
	"memberId" uuid,
	"durationMinutes" integer NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taskTimeLog" ADD CONSTRAINT "taskTimeLog_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskTimeLog" ADD CONSTRAINT "taskTimeLog_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskTimeLog" ADD CONSTRAINT "taskTimeLog_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_time_log_org_idx" ON "taskTimeLog" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "task_time_log_task_idx" ON "taskTimeLog" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "task_time_log_member_idx" ON "taskTimeLog" USING btree ("memberId");
