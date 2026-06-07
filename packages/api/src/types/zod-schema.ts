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

export const getProjectBySlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Project slug is required.")
    .max(80, "Project slug must be 80 characters or less."),
});

export const updateProjectBySlugSchema = z.object({
  currentSlug: z.string().min(1),
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

export const archiveProjectBySlugSchema = z.object({
  slug: z.string().trim().min(2),
});

export const deleteProjectBySlugSchema = z.object({
  slug: z.string().trim().min(2),
});

export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1, "Task name is required.").max(120),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  dueAt: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().optional().nullable(),
  ),
});

export const getTaskByKeySchema = z.object({
  key: z.string(),
});

export const updateTaskByKeySchema = z.object({
  key: z.string().trim().min(1, "Task key is required."),
  name: z.string().trim().min(1, "Task name is required.").max(120).optional(),
  description: z.string().trim().max(10000).optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  dueAt: z.preprocess(
    (value) => (value === "" ? null : value),
    z.coerce.date().optional().nullable(),
  ),
});

export const deleteTaskByKeySchema = z.object({
  key: z.string().trim().min(1, "Task key is required."),
});

export const getTaskCommentsSchema = z.object({
  taskKey: z.string().trim().min(1, "Task key is required."),
});

export const createTaskCommentSchema = z.object({
  taskKey: z.string().trim().min(1, "Task key is required."),
  body: z.string().trim().min(1, "Comment is required.").max(10000),
});

export const getTaskActivityEventsSchema = z.object({
  taskKey: z.string().trim().min(1, "Task key is required."),
});

export const createDocSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, "Title is required.").max(160).optional(),
  content: z.string().max(100000).optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(120, "Slug must be 120 characters or less.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
});

export const getDocsSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  includeDeleted: z.boolean().optional().default(false),
});

export const getDocByIdSchema = z.object({
  id: z.string().uuid(),
});

export const getDocBySlugSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required."),
});

export const updateDocTitleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required.").max(160),
});

export const updateDocContentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().max(100000),
});

export const deleteDocSchema = z.object({
  id: z.string().uuid(),
});

export const restoreDocSchema = z.object({
  id: z.string().uuid(),
});

export type OrgInviteDetailsFormValues = z.infer<typeof orgInviteDetailsSchema>;
export type JoinOrganizationListSchema = z.infer<
  typeof joinOrganizationListSchema
>;

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormValues = z.infer<typeof updateProjectBySlugSchema>;
export type CreateTaskFormValues = z.input<typeof createTaskSchema>;
export type UpdateTaskByKeyFormValues = z.input<typeof updateTaskByKeySchema>;
export type CreateTaskCommentFormValues = z.input<
  typeof createTaskCommentSchema
>;
