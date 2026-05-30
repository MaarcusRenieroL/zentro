ALTER TABLE "project" ALTER COLUMN "organizationId" SET DATA TYPE uuid USING "organizationId"::uuid;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "createdById" SET DATA TYPE uuid USING "createdById"::uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_createdById_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_organization_slug_unique" ON "project" USING btree ("organizationId","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_organization_status_idx" ON "project" USING btree ("organizationId","status");
