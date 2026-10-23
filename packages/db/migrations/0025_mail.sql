CREATE TABLE "mailMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"senderMemberId" uuid,
	"threadId" uuid NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"senderStarred" boolean DEFAULT false NOT NULL,
	"senderTrashedAt" timestamp,
	"senderPurgedAt" timestamp,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailRecipient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"kind" text DEFAULT 'to' NOT NULL,
	"readAt" timestamp,
	"starred" boolean DEFAULT false NOT NULL,
	"trashedAt" timestamp,
	"purgedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "mailMessage" ADD CONSTRAINT "mailMessage_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailMessage" ADD CONSTRAINT "mailMessage_senderMemberId_member_id_fk" FOREIGN KEY ("senderMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailRecipient" ADD CONSTRAINT "mailRecipient_messageId_mailMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."mailMessage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailRecipient" ADD CONSTRAINT "mailRecipient_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_message_thread_idx" ON "mailMessage" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "mail_message_sender_idx" ON "mailMessage" USING btree ("senderMemberId");--> statement-breakpoint
CREATE INDEX "mail_message_org_idx" ON "mailMessage" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "mail_recipient_member_idx" ON "mailRecipient" USING btree ("memberId");--> statement-breakpoint
CREATE INDEX "mail_recipient_message_idx" ON "mailRecipient" USING btree ("messageId");
