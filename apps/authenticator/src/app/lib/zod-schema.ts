import z from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8).regex(/\d/).regex(/[a-z]/).regex(/[A-Z]/),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
