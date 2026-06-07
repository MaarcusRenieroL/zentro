ALTER TABLE "project" ADD COLUMN "teamId" uuid;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "teamId" uuid;--> statement-breakpoint
ALTER TABLE "doc" ADD COLUMN "teamId" uuid;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc" ADD CONSTRAINT "doc_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_team_idx" ON "project" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX "task_team_status_idx" ON "task" USING btree ("teamId","status");--> statement-breakpoint
CREATE INDEX "doc_organization_team_idx" ON "doc" USING btree ("organizationId","teamId");