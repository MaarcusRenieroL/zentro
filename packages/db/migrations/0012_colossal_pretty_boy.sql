CREATE TABLE "permissionChangeLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"actorUserId" uuid,
	"action" text NOT NULL,
	"targetType" text NOT NULL,
	"targetId" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissionOverride" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"permission" text NOT NULL,
	"effect" text NOT NULL,
	"scopeType" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"reason" text,
	"createdByUserId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roleAssignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"principalType" text NOT NULL,
	"principalId" uuid NOT NULL,
	"scopeType" text NOT NULL,
	"scopeId" uuid NOT NULL,
	"createdByUserId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scope" text NOT NULL,
	"kind" text NOT NULL,
	"systemKey" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdByUserId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "visibility" text DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "permissionChangeLog" ADD CONSTRAINT "permissionChangeLog_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissionChangeLog" ADD CONSTRAINT "permissionChangeLog_actorUserId_user_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissionOverride" ADD CONSTRAINT "permissionOverride_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissionOverride" ADD CONSTRAINT "permissionOverride_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissionOverride" ADD CONSTRAINT "permissionOverride_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roleAssignment" ADD CONSTRAINT "roleAssignment_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roleAssignment" ADD CONSTRAINT "roleAssignment_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roleAssignment" ADD CONSTRAINT "roleAssignment_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "permission_change_log_organization_created_idx" ON "permissionChangeLog" USING btree ("organizationId","createdAt");--> statement-breakpoint
CREATE INDEX "permission_change_log_actor_idx" ON "permissionChangeLog" USING btree ("actorUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "permission_override_unique" ON "permissionOverride" USING btree ("userId","permission","scopeType","scopeId");--> statement-breakpoint
CREATE INDEX "permission_override_organization_user_idx" ON "permissionOverride" USING btree ("organizationId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "role_assignment_unique" ON "roleAssignment" USING btree ("roleId","principalType","principalId","scopeType","scopeId");--> statement-breakpoint
CREATE INDEX "role_assignment_organization_principal_idx" ON "roleAssignment" USING btree ("organizationId","principalType","principalId");--> statement-breakpoint
CREATE INDEX "role_assignment_scope_idx" ON "roleAssignment" USING btree ("scopeType","scopeId");--> statement-breakpoint
CREATE UNIQUE INDEX "role_organization_scope_name_unique" ON "role" USING btree ("organizationId","scope","name");--> statement-breakpoint
CREATE UNIQUE INDEX "role_organization_system_key_unique" ON "role" USING btree ("organizationId","systemKey");--> statement-breakpoint
CREATE INDEX "role_organization_idx" ON "role" USING btree ("organizationId");