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

export const createProjectSchema = z.object({
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
});

export const checkSlugSchema = z.object({
  slug: z.string().trim().min(2),
});

export type OrgInviteDetailsFormValues = z.infer<typeof orgInviteDetailsSchema>;
export type JoinOrganizationListSchema = z.infer<
  typeof joinOrganizationListSchema
>;

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
