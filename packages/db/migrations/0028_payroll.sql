CREATE TABLE "compensation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"employeeId" uuid NOT NULL,
	"annualSalary" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payRun" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"createdByMemberId" uuid,
	"label" text NOT NULL,
	"periodStart" date NOT NULL,
	"periodEnd" date NOT NULL,
	"deductionRateBps" integer DEFAULT 2000 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"approvedAt" timestamp,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payRunId" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"employeeId" uuid,
	"employeeName" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"base" integer NOT NULL,
	"bonus" integer DEFAULT 0 NOT NULL,
	"deductions" integer NOT NULL,
	"net" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compensation" ADD CONSTRAINT "compensation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compensation" ADD CONSTRAINT "compensation_employeeId_employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payRun" ADD CONSTRAINT "payRun_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payRun" ADD CONSTRAINT "payRun_createdByMemberId_member_id_fk" FOREIGN KEY ("createdByMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_payRunId_payRun_id_fk" FOREIGN KEY ("payRunId") REFERENCES "public"."payRun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_employeeId_employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "compensation_employee_unique" ON "compensation" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "pay_run_organization_idx" ON "payRun" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "payslip_run_idx" ON "payslip" USING btree ("payRunId");--> statement-breakpoint
CREATE INDEX "payslip_employee_idx" ON "payslip" USING btree ("employeeId");
