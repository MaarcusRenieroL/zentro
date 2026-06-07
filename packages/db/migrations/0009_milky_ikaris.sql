CREATE TABLE "teamMember" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"teamId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'slate' NOT NULL,
	"createdByMemberId" uuid,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_member_unique" ON "teamMember" USING btree ("teamId","memberId");--> statement-breakpoint
CREATE INDEX "team_member_organization_team_idx" ON "teamMember" USING btree ("organizationId","teamId");--> statement-breakpoint
CREATE INDEX "team_member_member_idx" ON "teamMember" USING btree ("memberId");--> statement-breakpoint
CREATE UNIQUE INDEX "team_organization_name_unique" ON "team" USING btree ("organizationId","name");--> statement-breakpoint
CREATE INDEX "team_organization_idx" ON "team" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "team_created_by_member_idx" ON "team" USING btree ("createdByMemberId");--> statement-breakpoint
CREATE INDEX "team_archived_at_idx" ON "team" USING btree ("archivedAt");