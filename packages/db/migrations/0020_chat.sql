CREATE TABLE "chatChannel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"kind" text DEFAULT 'channel' NOT NULL,
	"name" text,
	"topic" text,
	"description" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"linkType" text,
	"linkId" uuid,
	"createdByMemberId" uuid,
	"archivedAt" timestamp,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatMember" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channelId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"notify" text DEFAULT 'all' NOT NULL,
	"notifyReplies" boolean DEFAULT true NOT NULL,
	"mutedUntil" timestamp,
	"pinned" boolean DEFAULT false NOT NULL,
	"lastReadAt" timestamp DEFAULT now() NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"channelId" uuid NOT NULL,
	"authorMemberId" uuid,
	"parentId" uuid,
	"clientId" text,
	"body" text NOT NULL,
	"pinnedAt" timestamp,
	"pinnedByMemberId" uuid,
	"editedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatReaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"emoji" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatAttachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"fileId" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"uploadedByMemberId" uuid,
	"name" text NOT NULL,
	"mimeType" text NOT NULL,
	"size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"storageKey" text NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatChannel" ADD CONSTRAINT "chatChannel_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatChannel" ADD CONSTRAINT "chatChannel_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMember" ADD CONSTRAINT "chatMember_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMember" ADD CONSTRAINT "chatMember_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessage" ADD CONSTRAINT "chatMessage_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessage" ADD CONSTRAINT "chatMessage_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessage" ADD CONSTRAINT "chatMessage_authorMemberId_member_id_fk" FOREIGN KEY ("authorMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessage" ADD CONSTRAINT "chatMessage_pinnedByMemberId_member_id_fk" FOREIGN KEY ("pinnedByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatReaction" ADD CONSTRAINT "chatReaction_messageId_chatMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chatMessage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatReaction" ADD CONSTRAINT "chatReaction_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatAttachment" ADD CONSTRAINT "chatAttachment_fileId_file_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_uploadedByMemberId_member_id_fk" FOREIGN KEY ("uploadedByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_channel_name_idx" ON "chatChannel" USING btree ("organizationId","name");--> statement-breakpoint
CREATE INDEX "chat_channel_org_kind_idx" ON "chatChannel" USING btree ("organizationId","kind");--> statement-breakpoint
CREATE INDEX "chat_channel_link_idx" ON "chatChannel" USING btree ("linkType","linkId");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_member_unique_idx" ON "chatMember" USING btree ("channelId","memberId");--> statement-breakpoint
CREATE INDEX "chat_member_member_idx" ON "chatMember" USING btree ("memberId");--> statement-breakpoint
CREATE INDEX "chat_message_channel_created_idx" ON "chatMessage" USING btree ("channelId","createdAt");--> statement-breakpoint
CREATE INDEX "chat_message_parent_idx" ON "chatMessage" USING btree ("parentId");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_message_client_idx" ON "chatMessage" USING btree ("authorMemberId","clientId");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_reaction_unique_idx" ON "chatReaction" USING btree ("messageId","memberId","emoji");--> statement-breakpoint
CREATE INDEX "chat_attachment_message_idx" ON "chatAttachment" USING btree ("messageId");--> statement-breakpoint
CREATE INDEX "chat_attachment_file_idx" ON "chatAttachment" USING btree ("fileId");--> statement-breakpoint
CREATE INDEX "file_organization_idx" ON "file" USING btree ("organizationId");