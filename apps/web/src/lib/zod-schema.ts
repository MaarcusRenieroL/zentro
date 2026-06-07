import z from "zod";

export const generalSectionSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export const projectGeneralSectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters.")
    .max(80, "Project name must be 80 characters or less."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(80, "Slug must be 80 characters or less.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less.")
    .optional()
    .or(z.literal("")),
  teamId: z.string().uuid().optional().nullable(),
});

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
});

export type GeneralSectionFormValues = z.infer<typeof generalSectionSchema>;
export type ProjectGeneralSectionFormValues = z.infer<
  typeof projectGeneralSectionSchema
>;
export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
