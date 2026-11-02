CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"number" integer NOT NULL,
	"subject" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"requesterName" text NOT NULL,
	"requesterEmail" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"category" text,
	"assigneeMemberId" uuid,
	"createdByMemberId" uuid,
	"linkedTaskId" uuid,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticketMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticketId" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"authorMemberId" uuid,
	"kind" text DEFAULT 'reply' NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assigneeMemberId_member_id_fk" FOREIGN KEY ("assigneeMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_linkedTaskId_task_id_fk" FOREIGN KEY ("linkedTaskId") REFERENCES "public"."task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticketMessage" ADD CONSTRAINT "ticketMessage_ticketId_ticket_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticketMessage" ADD CONSTRAINT "ticketMessage_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticketMessage" ADD CONSTRAINT "ticketMessage_authorMemberId_member_id_fk" FOREIGN KEY ("authorMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_organization_number_unique" ON "ticket" USING btree ("organizationId","number");--> statement-breakpoint
CREATE INDEX "ticket_queue_idx" ON "ticket" USING btree ("organizationId","status");--> statement-breakpoint
CREATE INDEX "ticket_assignee_idx" ON "ticket" USING btree ("assigneeMemberId");--> statement-breakpoint
CREATE INDEX "ticket_message_ticket_idx" ON "ticketMessage" USING btree ("ticketId");
