const requiredEnv = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "RESEND_API_KEY",
] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

function readRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  for (const key of requiredEnv) {
    readRequiredEnv(key);
  }

  if (process.env.BETTER_AUTH_SECRET!.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
  }
}

// Resend only delivers from its own address to the account owner. Set
// EMAIL_FROM to a sender on a domain verified in Resend to reach everyone.
const defaultEmailFrom = "Zentro <onboarding@resend.dev>";

export const authEnv = {
  get RESEND_API_KEY() {
    return readRequiredEnv("RESEND_API_KEY");
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM || defaultEmailFrom;
  },
};
