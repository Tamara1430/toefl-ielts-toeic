import { createAdminClient } from "@/lib/supabase/admin";

export interface GroqRateLimitRow {
  model: string;
  limit_requests: number | null;
  remaining_requests: number | null;
  reset_requests: string | null;
  limit_tokens: number | null;
  remaining_tokens: number | null;
  reset_tokens: string | null;
  updated_at: string;
}

function num(headers: Headers, key: string): number | null {
  const v = headers.get(key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Best-effort: parses Groq's `x-ratelimit-*` response headers — sent on
 * every real API call, at no extra cost — and stores the latest snapshot
 * per model. This is how the admin panel shows "sisa kuota Groq" WITHOUT
 * ever pinging Groq on purpose just to check; it just remembers what the
 * last real request already told us.
 *
 * Never throws — a failed write here must never break the actual
 * user-facing request (feedback, transcription, generation) that
 * triggered it.
 */
export async function recordGroqUsage(model: string, headers: Headers): Promise<void> {
  try {
    const limitRequests = num(headers, "x-ratelimit-limit-requests");
    const remainingRequests = num(headers, "x-ratelimit-remaining-requests");
    const resetRequests = headers.get("x-ratelimit-reset-requests");
    const limitTokens = num(headers, "x-ratelimit-limit-tokens");
    const remainingTokens = num(headers, "x-ratelimit-remaining-tokens");
    const resetTokens = headers.get("x-ratelimit-reset-tokens");

    // Groq didn't send any rate-limit headers this time — nothing to record.
    if (
      limitRequests === null &&
      remainingRequests === null &&
      limitTokens === null &&
      remainingTokens === null
    ) {
      return;
    }

    const admin = createAdminClient();
    await admin.from("groq_rate_limits").upsert({
      model,
      limit_requests: limitRequests,
      remaining_requests: remainingRequests,
      reset_requests: resetRequests,
      limit_tokens: limitTokens,
      remaining_tokens: remainingTokens,
      reset_tokens: resetTokens,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Gagal simpan snapshot rate limit Groq:", e);
  }
}

/**
 * Wraps a Groq SDK call that returns a parsed object (chat completions,
 * transcriptions, etc) — the kind where you'd normally just `await
 * client.x.create(...)`. Uses `.withResponse()` to also grab the raw
 * headers, records usage in the background, and returns the same parsed
 * data the caller would've gotten from a plain `.create(...)` call.
 */
export async function withGroqUsage<T>(
  model: string,
  promise: { withResponse(): Promise<{ data: T; response: Response }> }
): Promise<T> {
  const { data, response } = await promise.withResponse();
  void recordGroqUsage(model, response.headers);
  return data;
}
