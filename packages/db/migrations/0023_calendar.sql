CREATE TABLE "calendarEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"createdByMemberId" uuid,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"color" text DEFAULT 'blue' NOT NULL,
	"allDay" boolean DEFAULT false NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_range_idx" ON "calendarEvent" USING btree ("organizationId","startsAt");