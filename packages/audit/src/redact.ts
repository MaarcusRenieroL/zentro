const secretKey = /password|token|secret|otp|code|authorization|cookie/i;

export const redactedValue = "[redacted]";

/**
 * Removes every key that could hold a secret, at any depth, and returns a
 * copy. Nothing that looks like a password, token, one-time code, secret,
 * authorization header or cookie is ever stored.
 */
export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      if (secretKey.test(key)) {
        continue;
      }

      result[key] = redactSecrets(item);
    }

    return result as T;
  }

  return value;
}
