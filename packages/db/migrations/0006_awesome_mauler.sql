CREATE TABLE "taskActivityEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"taskId" uuid NOT NULL,
	"actorMemberId" uuid,
	"type" text NOT NULL,
	"field" text,
	"fromValue" text,
	"toValue" text,
	"commentId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taskComment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"taskId" uuid NOT NULL,
	"authorMemberId" uuid,
	"body" text NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taskActivityEvent" ADD CONSTRAINT "taskActivityEvent_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskActivityEvent" ADD CONSTRAINT "taskActivityEvent_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskActivityEvent" ADD CONSTRAINT "taskActivityEvent_actorMemberId_member_id_fk" FOREIGN KEY ("actorMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskComment" ADD CONSTRAINT "taskComment_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskComment" ADD CONSTRAINT "taskComment_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskComment" ADD CONSTRAINT "taskComment_authorMemberId_member_id_fk" FOREIGN KEY ("authorMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_activity_organization_task_idx" ON "taskActivityEvent" USING btree ("organizationId","taskId");--> statement-breakpoint
CREATE INDEX "task_activity_actor_idx" ON "taskActivityEvent" USING btree ("actorMemberId");--> statement-breakpoint
CREATE INDEX "task_activity_created_at_idx" ON "taskActivityEvent" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "task_comment_organization_task_idx" ON "taskComment" USING btree ("organizationId","taskId");--> statement-breakpoint
CREATE INDEX "task_comment_author_idx" ON "taskComment" USING btree ("authorMemberId");