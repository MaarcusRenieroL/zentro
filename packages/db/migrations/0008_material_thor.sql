CREATE TABLE "docComment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"docId" uuid NOT NULL,
	"authorMemberId" uuid,
	"body" text NOT NULL,
	"resolvedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "docComment" ADD CONSTRAINT "docComment_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docComment" ADD CONSTRAINT "docComment_docId_doc_id_fk" FOREIGN KEY ("docId") REFERENCES "public"."doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docComment" ADD CONSTRAINT "docComment_authorMemberId_member_id_fk" FOREIGN KEY ("authorMemberId") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_comment_organization_doc_idx" ON "docComment" USING btree ("organizationId","docId");--> statement-breakpoint
CREATE INDEX "doc_comment_author_idx" ON "docComment" USING btree ("authorMemberId");--> statement-breakpoint
CREATE INDEX "doc_comment_resolved_idx" ON "docComment" USING btree ("resolvedAt");