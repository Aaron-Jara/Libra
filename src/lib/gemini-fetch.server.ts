/** Server-side Gemini HTTP helper: longer timeout + one retry on abort. */

export const GEMINI_REQUEST_TIMEOUT_MS = 30_000;

export type GeminiFetchResult =
  | { ok: true; response: Response }
  | { ok: false; error: string };

export async function fetchGeminiWithRetry(
  url: string,
  init: Omit<RequestInit, "signal">,
): Promise<GeminiFetchResult> {
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GEMINI_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return { ok: true, response };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error calling Gemini";
      const isAbort = message.toLowerCase().includes("aborted");

      if (!isAbort) {
        return { ok: false, error: message };
      }

      if (attempt < maxAttempts - 1) {
        continue;
      }

      return { ok: false, error: "Gemini request timed out" };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ok: false, error: "Gemini request timed out" };
}
