import z from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Add your name. Teammates see it on tasks, comments and mentions."),
  email: z.email("Enter an email like name@company.com."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/\d/, "Add a number to your password.")
    .regex(/[a-z]/, "Add a lowercase letter to your password.")
    .regex(/[A-Z]/, "Add an uppercase letter to your password."),
});

export const signInSchema = z.object({
  email: z.email("Enter an email like name@company.com."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter an email like name@company.com."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/\d/, "Add a number to your password.")
      .regex(/[a-z]/, "Add a lowercase letter to your password.")
      .regex(/[A-Z]/, "Add an uppercase letter to your password."),
    confirmNewPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/\d/, "Add a number to your password.")
      .regex(/[a-z]/, "Add a lowercase letter to your password.")
      .regex(/[A-Z]/, "Add an uppercase letter to your password."),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "These passwords don’t match. Check both and try again.",
    path: ["confirmNewPassword"],
  });

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Name your workspace with at least 2 characters."),
  slug: z
    .string()
    .min(2, "The workspace URL needs at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single dashes only.",
    ),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;
