CREATE TABLE "workLink" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"sourceType" text NOT NULL,
	"sourceId" uuid NOT NULL,
	"targetType" text NOT NULL,
	"targetId" uuid NOT NULL,
	"kind" text NOT NULL,
	"via" text,
	"createdByMemberId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workLink" ADD CONSTRAINT "workLink_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workLink" ADD CONSTRAINT "workLink_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "work_link_unique_idx" ON "workLink" USING btree ("organizationId","sourceType","sourceId","targetType","targetId","kind");--> statement-breakpoint
CREATE INDEX "work_link_source_idx" ON "workLink" USING btree ("sourceType","sourceId");--> statement-breakpoint
CREATE INDEX "work_link_target_idx" ON "workLink" USING btree ("targetType","targetId");