CREATE TABLE "chatBookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channelId" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdByMemberId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatDraft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" uuid NOT NULL,
	"channelId" uuid NOT NULL,
	"scope" text NOT NULL,
	"body" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatEmoji" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" text NOT NULL,
	"fileId" uuid NOT NULL,
	"createdByMemberId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatFeedRule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channelId" uuid NOT NULL,
	"events" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatLinkPreview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"image" text,
	"siteName" text,
	"failed" boolean DEFAULT false NOT NULL,
	"fetchedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatPollVote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pollId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"optionIndex" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatPoll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"multiple" boolean DEFAULT false NOT NULL,
	"closedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "chatSaved" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"remindAt" timestamp,
	"remindedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatScheduled" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"channelId" uuid NOT NULL,
	"parentId" uuid,
	"body" text NOT NULL,
	"sendAt" timestamp NOT NULL,
	"sentAt" timestamp,
	"canceledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatStatus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" uuid NOT NULL,
	"emoji" text,
	"text" text,
	"expiresAt" timestamp,
	"dndUntil" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatThreadFollow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memberId" uuid NOT NULL,
	"parentId" uuid NOT NULL,
	"following" boolean DEFAULT true NOT NULL,
	"lastReadAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatChannel" ADD COLUMN "canvas" text;
--> statement-breakpoint
ALTER TABLE "chatChannel" ADD COLUMN "retentionDays" integer;
--> statement-breakpoint
ALTER TABLE "chatMessage" ADD COLUMN "kind" text DEFAULT 'message' NOT NULL;
--> statement-breakpoint
ALTER TABLE "chatMessage" ADD COLUMN "forwardedFromId" uuid;
--> statement-breakpoint
ALTER TABLE "chatMessage" ADD COLUMN "meta" jsonb;
--> statement-breakpoint
ALTER TABLE "chatBookmark" ADD CONSTRAINT "chatBookmark_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatBookmark" ADD CONSTRAINT "chatBookmark_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatDraft" ADD CONSTRAINT "chatDraft_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatDraft" ADD CONSTRAINT "chatDraft_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatEmoji" ADD CONSTRAINT "chatEmoji_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatEmoji" ADD CONSTRAINT "chatEmoji_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatFeedRule" ADD CONSTRAINT "chatFeedRule_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatLinkPreview" ADD CONSTRAINT "chatLinkPreview_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatPollVote" ADD CONSTRAINT "chatPollVote_pollId_chatPoll_id_fk" FOREIGN KEY ("pollId") REFERENCES "public"."chatPoll"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatPollVote" ADD CONSTRAINT "chatPollVote_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatPoll" ADD CONSTRAINT "chatPoll_messageId_chatMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chatMessage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatSaved" ADD CONSTRAINT "chatSaved_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatSaved" ADD CONSTRAINT "chatSaved_messageId_chatMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chatMessage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatScheduled" ADD CONSTRAINT "chatScheduled_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatScheduled" ADD CONSTRAINT "chatScheduled_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatScheduled" ADD CONSTRAINT "chatScheduled_channelId_chatChannel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."chatChannel"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatStatus" ADD CONSTRAINT "chatStatus_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatThreadFollow" ADD CONSTRAINT "chatThreadFollow_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chatThreadFollow" ADD CONSTRAINT "chatThreadFollow_parentId_chatMessage_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."chatMessage"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_bookmark_channel_idx" ON "chatBookmark" USING btree ("channelId");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_draft_unique_idx" ON "chatDraft" USING btree ("memberId","scope");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_emoji_unique_idx" ON "chatEmoji" USING btree ("organizationId","name");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_feed_rule_channel_idx" ON "chatFeedRule" USING btree ("channelId");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_link_preview_unique_idx" ON "chatLinkPreview" USING btree ("organizationId","url");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_poll_vote_unique_idx" ON "chatPollVote" USING btree ("pollId","memberId","optionIndex");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_poll_message_idx" ON "chatPoll" USING btree ("messageId");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_saved_unique_idx" ON "chatSaved" USING btree ("memberId","messageId");
--> statement-breakpoint
CREATE INDEX "chat_saved_remind_idx" ON "chatSaved" USING btree ("remindAt");
--> statement-breakpoint
CREATE INDEX "chat_scheduled_due_idx" ON "chatScheduled" USING btree ("sendAt");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_status_member_idx" ON "chatStatus" USING btree ("memberId");
--> statement-breakpoint
CREATE UNIQUE INDEX "chat_thread_follow_unique_idx" ON "chatThreadFollow" USING btree ("memberId","parentId");
