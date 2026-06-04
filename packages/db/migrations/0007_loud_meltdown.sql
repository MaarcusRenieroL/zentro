CREATE TABLE "doc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"projectId" uuid,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"createdByMemberId" uuid,
	"archivedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doc" ADD CONSTRAINT "doc_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc" ADD CONSTRAINT "doc_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc" ADD CONSTRAINT "doc_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_organization_deleted_at_idx" ON "doc" USING btree ("organizationId","deletedAt");--> statement-breakpoint
CREATE INDEX "doc_organization_project_idx" ON "doc" USING btree ("organizationId","projectId");--> statement-breakpoint
CREATE INDEX "doc_created_by_member_idx" ON "doc" USING btree ("createdByMemberId");--> statement-breakpoint
CREATE INDEX "doc_updated_at_idx" ON "doc" USING btree ("updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "doc_organization_slug_unique" ON "doc" USING btree ("organizationId","slug");
