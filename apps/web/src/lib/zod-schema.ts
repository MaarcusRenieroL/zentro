import z from "zod";

export const generalSectionSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export type GeneralSectionFormValues = z.infer<typeof generalSectionSchema>;
