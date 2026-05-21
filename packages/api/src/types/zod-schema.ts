import z from "zod";

export const orgInviteDetailsSchema = z.object({
  invitationId: z.string(),
});

export type OrgInviteDetailsFormValues = z.infer<typeof orgInviteDetailsSchema>;
