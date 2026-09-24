import Groq from "groq-sdk";

/**
 * Retries a Groq SDK call when it hits a 429 (rate limit) response.
 *
 * Groq's free tier shares one request/token budget across the WHOLE app
 * (per API key, not per student) — e.g. `openai/gpt-oss-120b` is capped at
 * 30 requests/min and 8,000 tokens/min. During Ujian Speaking, several
 * students answering around the same time can burn through that budget in
 * seconds, even though nothing is actually being billed (Free tier = $0).
 *
 * Instead of failing the user's exam attempt outright, this waits for
 * whatever Groq's `retry-after` header says (falling back to exponential
 * backoff if it's missing) and tries again a couple of times. `fn` must be
 * a factory — NOT an already-created promise — so each retry issues a
 * genuinely new request rather than re-awaiting an already-settled one.
 */
export async function withGroqRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelayMs = 1500 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof Groq.RateLimitError) || attempt >= retries) throw err;

      const retryAfterHeader = err.headers?.get?.("retry-after");
      const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const waitMs = Number.isFinite(retryAfterSec)
        ? retryAfterSec * 1000 + 250
        : baseDelayMs * 2 ** attempt;

      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt += 1;
    }
  }
}
