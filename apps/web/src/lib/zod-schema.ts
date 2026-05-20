import z from "zod";

export const generalSectionSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
});

export type GeneralSectionFormValues = z.infer<typeof generalSectionSchema>;
export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
