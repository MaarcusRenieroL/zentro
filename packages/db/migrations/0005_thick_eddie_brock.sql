CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"key" text NOT NULL,
	"taskNumber" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"createdByMemberId" uuid,
	"assignedToMemberId" uuid,
	"dueAt" timestamp,
	"completedAt" timestamp,
	"archivedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "taskKeyPrefix" text;--> statement-breakpoint
WITH "projectPrefixes" AS (
	SELECT
		"id",
		"organizationId",
		COALESCE(
			NULLIF(upper(left(regexp_replace("slug", '[^a-zA-Z0-9]', '', 'g'), 6)), ''),
			'TASK'
		) AS "basePrefix",
		row_number() OVER (
			PARTITION BY
				"organizationId",
				COALESCE(
					NULLIF(upper(left(regexp_replace("slug", '[^a-zA-Z0-9]', '', 'g'), 6)), ''),
					'TASK'
				)
			ORDER BY "createdAt", "id"
		) AS "prefixRank"
	FROM "project"
)
UPDATE "project"
SET "taskKeyPrefix" = CASE
	WHEN "projectPrefixes"."prefixRank" = 1 THEN "projectPrefixes"."basePrefix"
	ELSE left(
		"projectPrefixes"."basePrefix",
		greatest(1, 6 - length("projectPrefixes"."prefixRank"::text))
	) || "projectPrefixes"."prefixRank"::text
END
FROM "projectPrefixes"
WHERE "project"."id" = "projectPrefixes"."id";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "taskKeyPrefix" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignedToMemberId_member_id_fk" FOREIGN KEY ("assignedToMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_organization_key_unique" ON "task" USING btree ("organizationId","key");--> statement-breakpoint
CREATE UNIQUE INDEX "task_project_number_unique" ON "task" USING btree ("projectId","taskNumber");--> statement-breakpoint
CREATE INDEX "task_organization_status_idx" ON "task" USING btree ("organizationId","status");--> statement-breakpoint
CREATE INDEX "task_project_status_idx" ON "task" USING btree ("projectId","status");--> statement-breakpoint
CREATE INDEX "task_assigned_to_member_idx" ON "task" USING btree ("assignedToMemberId");--> statement-breakpoint
CREATE INDEX "task_due_at_idx" ON "task" USING btree ("dueAt");--> statement-breakpoint
CREATE UNIQUE INDEX "project_organization_task_key_prefix_unique" ON "project" USING btree ("organizationId","taskKeyPrefix");
