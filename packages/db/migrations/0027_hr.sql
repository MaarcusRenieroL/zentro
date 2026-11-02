CREATE TABLE "employee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"memberId" uuid,
	"managerId" uuid,
	"name" text NOT NULL,
	"email" text,
	"jobTitle" text DEFAULT '' NOT NULL,
	"department" text,
	"location" text,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" date,
	"endDate" date,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaveRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"employeeId" uuid NOT NULL,
	"type" text DEFAULT 'annual' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"days" numeric(5, 1) NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"decidedByMemberId" uuid,
	"decidedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_memberId_member_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_managerId_employee_id_fk" FOREIGN KEY ("managerId") REFERENCES "public"."employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_employeeId_employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_decidedByMemberId_member_id_fk" FOREIGN KEY ("decidedByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_organization_idx" ON "employee" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_member_unique" ON "employee" USING btree ("organizationId","memberId");--> statement-breakpoint
CREATE INDEX "leave_request_employee_idx" ON "leaveRequest" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "leave_request_status_idx" ON "leaveRequest" USING btree ("organizationId","status");
