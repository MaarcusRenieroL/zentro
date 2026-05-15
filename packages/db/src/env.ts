const requiredEnv = ["DATABASE_URL"] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

function readRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const dbEnv = {
  DATABASE_URL: readRequiredEnv("DATABASE_URL"),
};
