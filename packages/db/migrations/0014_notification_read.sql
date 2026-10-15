CREATE TABLE "notificationRead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"itemKey" text NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notificationRead" ADD CONSTRAINT "notificationRead_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificationRead" ADD CONSTRAINT "notificationRead_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_read_unique_idx" ON "notificationRead" USING btree ("organizationId","userId","itemKey");--> statement-breakpoint
CREATE INDEX "notification_read_user_idx" ON "notificationRead" USING btree ("userId");