import { TRPCError } from "@trpc/server";
import { APIError } from "better-auth/api";

const codes: Record<string, TRPCError["code"]> = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
};

/** Runs a Better Auth call and reports its failures as tRPC errors. */
export async function callAuth<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof APIError) {
      throw new TRPCError({
        code: codes[String(error.status)] ?? "BAD_REQUEST",
        message: error.message || "The request was rejected.",
        cause: error,
      });
    }

    throw error;
  }
}
