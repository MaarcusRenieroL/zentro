/**
 * Summaries and translations for chat. They call the Claude API when
 * ANTHROPIC_API_KEY is set; without it `aiAvailable()` is false and callers
 * fall back (summaries) or say it is not configured (translation).
 */
const MODEL = process.env.CHAT_AI_MODEL ?? "claude-sonnet-5-5";

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function askClaude(system: string, prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  return (
    data.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim() || null
  );
}
