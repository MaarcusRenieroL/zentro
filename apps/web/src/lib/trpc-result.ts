import { TRPCClientError } from "@trpc/client";

/**
 * Runs a tRPC call and reports failure as `{ error }` instead of throwing, so
 * call sites read like the Better Auth client calls they replaced.
 */
export async function trpcResult<T>(
  call: Promise<T>,
): Promise<
  | { data: T; error: null }
  | { data: null; error: { statusText: string; message: string } }
> {
  try {
    return { data: await call, error: null };
  } catch (error) {
    if (error instanceof TRPCClientError) {
      return {
        data: null,
        error: {
          statusText: String(error.data?.code ?? "Error"),
          message: error.message,
        },
      };
    }

    return {
      data: null,
      error: { statusText: "Error", message: "Something went wrong." },
    };
  }
}
