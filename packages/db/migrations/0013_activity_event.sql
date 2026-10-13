CREATE TABLE "activityEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"actorUserId" uuid,
	"action" text NOT NULL,
	"targetType" text NOT NULL,
	"targetId" text NOT NULL,
	"targetLabel" text,
	"projectId" uuid,
	"teamId" uuid,
	"auditOnly" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"userAgent" text,
	"requestId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "appliedDefaults" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "activityEvent" ADD CONSTRAINT "activityEvent_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityEvent" ADD CONSTRAINT "activityEvent_actorUserId_user_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_event_organization_created_idx" ON "activityEvent" USING btree ("organizationId","createdAt" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_event_target_idx" ON "activityEvent" USING btree ("organizationId","targetType","targetId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_event_actor_idx" ON "activityEvent" USING btree ("organizationId","actorUserId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_event_project_idx" ON "activityEvent" USING btree ("organizationId","projectId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_event_action_idx" ON "activityEvent" USING btree ("organizationId","action","createdAt" DESC NULLS LAST);
--> statement-breakpoint
-- The default keys system roles had before this migration count as already
-- applied, so keys an administrator removed are not given back later.
UPDATE "role" SET "appliedDefaults" = '["org.settings.view","org.settings.update","org.delete","org.ownership.transfer","members.view","members.invite","members.remove","members.role.update","invitations.view","invitations.cancel","invitations.resend","teams.view","teams.create","teams.update","teams.delete","teams.members.manage","roles.view","roles.create","roles.update","roles.delete","roles.assign","permissions.overrides.manage","permissions.log.view","permissions.explain","projects.view","projects.view_private","projects.create","projects.update","projects.archive","projects.restore","projects.delete","projects.members.manage","projects.settings.manage","tasks.view","tasks.create","tasks.update_own","tasks.update_any","tasks.delete_own","tasks.delete_any","tasks.assign","tasks.comment","tasks.activity.view","docs.view","docs.create","docs.update_own","docs.update_any","docs.trash_own","docs.trash_any","docs.restore","docs.delete","docs.comment","docs.search","modules.view","modules.manage","comments.update_own","comments.update_any","comments.delete_own","comments.delete_any"]'::jsonb WHERE "kind" = 'system' AND "systemKey" = 'owner';--> statement-breakpoint
UPDATE "role" SET "appliedDefaults" = '["org.settings.view","org.settings.update","members.view","members.invite","members.remove","members.role.update","invitations.view","invitations.cancel","invitations.resend","teams.view","teams.create","teams.update","teams.delete","teams.members.manage","roles.view","roles.create","roles.update","roles.delete","roles.assign","permissions.overrides.manage","permissions.log.view","permissions.explain","projects.view","projects.view_private","projects.create","projects.update","projects.archive","projects.restore","projects.delete","projects.members.manage","projects.settings.manage","tasks.view","tasks.create","tasks.update_own","tasks.update_any","tasks.delete_own","tasks.delete_any","tasks.assign","tasks.comment","tasks.activity.view","docs.view","docs.create","docs.update_own","docs.update_any","docs.trash_own","docs.trash_any","docs.restore","docs.delete","docs.comment","docs.search","modules.view","modules.manage","comments.update_own","comments.update_any","comments.delete_own","comments.delete_any"]'::jsonb WHERE "kind" = 'system' AND "systemKey" = 'admin';--> statement-breakpoint
UPDATE "role" SET "appliedDefaults" = '["members.view","teams.view","projects.view","tasks.view","tasks.create","tasks.update_own","tasks.update_any","tasks.delete_own","tasks.delete_any","tasks.assign","tasks.comment","tasks.activity.view","docs.view","docs.create","docs.update_own","docs.update_any","docs.trash_own","docs.trash_any","docs.restore","docs.comment","docs.search","modules.view"]'::jsonb WHERE "kind" = 'system' AND "systemKey" = 'member';--> statement-breakpoint

-- Backfill (idempotent): task activity. The old table stays untouched.
INSERT INTO "activityEvent" ("id", "organizationId", "actorUserId", "action", "targetType", "targetId", "targetLabel", "projectId", "teamId", "auditOnly", "metadata", "createdAt")
SELECT
	e."id",
	e."organizationId",
	m."userId",
	CASE
		WHEN e."type" = 'comment.created' THEN 'task.comment_added'
		WHEN e."type" = 'task.updated' AND e."field" = 'status' THEN 'task.status_changed'
		WHEN e."type" = 'task.updated' AND e."field" = 'assignedToMemberId' THEN 'task.assigned'
		ELSE e."type"
	END,
	'task',
	t."id"::text,
	t."key",
	t."projectId",
	t."teamId",
	false,
	jsonb_build_object('backfilled', true)
	|| CASE WHEN e."commentId" IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('commentId', e."commentId") END
	|| CASE WHEN e."field" IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('changes', jsonb_build_array(jsonb_build_object(
			'field', CASE WHEN e."field" = 'assignedToMemberId' THEN 'assignee' ELSE e."field" END,
			'from', CASE WHEN e."field" = 'assignedToMemberId'
				THEN (SELECT u."name" FROM "member" fm JOIN "user" u ON u."id" = fm."userId" WHERE fm."id"::text = e."fromValue")
				ELSE e."fromValue" END,
			'to', CASE WHEN e."field" = 'assignedToMemberId'
				THEN (SELECT u."name" FROM "member" tm JOIN "user" u ON u."id" = tm."userId" WHERE tm."id"::text = e."toValue")
				ELSE e."toValue" END
		))) END,
	e."createdAt"
FROM "taskActivityEvent" e
JOIN "task" t ON t."id" = e."taskId"
LEFT JOIN "member" m ON m."id" = e."actorMemberId"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- Backfill (idempotent): the permission change log. The old table stays untouched.
INSERT INTO "activityEvent" ("id", "organizationId", "actorUserId", "action", "targetType", "targetId", "targetLabel", "projectId", "teamId", "auditOnly", "metadata", "createdAt")
SELECT
	l."id",
	l."organizationId",
	l."actorUserId",
	CASE l."action"
		WHEN 'override.created' THEN 'override.set'
		WHEN 'override.updated' THEN 'override.set'
		WHEN 'member.role.updated' THEN 'member.role_updated'
		WHEN 'ownership.transferred' THEN 'org.ownership_transferred'
		WHEN 'invitation.created' THEN 'invitation.sent'
		WHEN 'organization.updated' THEN 'org.updated'
		WHEN 'project.access.updated' THEN 'project.visibility_changed'
		ELSE l."action"
	END,
	l."targetType",
	l."targetId",
	COALESCE(l."after"->>'name', l."before"->>'name', l."after"->>'roleName', l."before"->>'roleName'),
	CASE WHEN l."targetType" = 'project' AND l."targetId" ~ '^[0-9a-fA-F-]{36}$' THEN l."targetId"::uuid END,
	CASE WHEN l."targetType" = 'team' AND l."targetId" ~ '^[0-9a-fA-F-]{36}$' THEN l."targetId"::uuid END,
	true,
	jsonb_build_object('backfilled', true)
		|| CASE WHEN l."before" IS NULL OR l."before" = 'null'::jsonb THEN '{}'::jsonb ELSE jsonb_build_object('before', l."before") END
		|| CASE WHEN l."after" IS NULL OR l."after" = 'null'::jsonb THEN '{}'::jsonb ELSE jsonb_build_object('after', l."after") END,
	l."createdAt"
FROM "permissionChangeLog" l
ON CONFLICT ("id") DO NOTHING;
