import z from "zod";

export const orgInviteDetailsSchema = z.object({
  invitationId: z.string(),
});

export const joinOrganizationListSchema = z.object({
  id: z.string(),
  orgName: z.string(),
  orgSlug: z.string(),
  invitedBy: z.string(),
  role: z.string(),
});

export type OrgInviteDetailsFormValues = z.infer<typeof orgInviteDetailsSchema>;
export type JoinOrganizationListSchema = z.infer<
  typeof joinOrganizationListSchema
>;
