import { runChatJobs } from "@zentro/api/server";
import { db } from "@zentro/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Chat's background work: scheduled messages, reminders, retention and
 * overdue-task notices. Called by a scheduler (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`; page loads also run the cheap part.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await runChatJobs(
    db as unknown as Parameters<typeof runChatJobs>[0],
    { heavy: true },
  );

  return Response.json(result);
}
