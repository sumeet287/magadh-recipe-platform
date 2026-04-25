/**
 * Broadcast processor trigger helper.
 *
 * Spawns a fresh Vercel function invocation of
 * `/api/cron/broadcasts/process` by making an authenticated HTTP request to
 * the deployment's own URL. Used in two places:
 *
 *   1. Admin POST /api/admin/broadcasts — kicks off sending immediately after
 *      the broadcast row is created, so the admin does not have to wait for
 *      the daily Vercel cron.
 *   2. The processor itself — after a batch finishes and recipients are
 *      still PENDING, it triggers another invocation of itself so the next
 *      batch starts right away under a fresh 60s serverless budget.
 *
 * Each invocation is a new Vercel function, so we get a clean timeout window
 * per batch and never block the caller.
 *
 * Safety:
 *   - Fire-and-forget style: errors are swallowed and logged. The daily cron
 *     remains a safety net that will eventually resume any stuck broadcast.
 *   - Should always be scheduled via `after()` from `next/server` so the
 *     caller's response is returned before this runs, but the function
 *     instance is kept alive long enough for the fetch to complete.
 */

export async function triggerBroadcastProcessor(): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(
      "[broadcast-trigger] CRON_SECRET not set — skipping inline trigger; daily cron will pick up the broadcast later"
    );
    return;
  }

  const base = resolveBaseUrl();
  if (!base) {
    console.warn(
      "[broadcast-trigger] Could not resolve deployment URL — skipping inline trigger; daily cron will pick up the broadcast later"
    );
    return;
  }

  const url = `${base}/api/cron/broadcasts/process`;

  // We only need to *initiate* the downstream invocation — not wait for it
  // to finish sending messages (which may take 30-60s). The AbortSignal
  // ensures we return as soon as the request reaches Vercel's router, at
  // which point the downstream serverless function runs independently
  // regardless of whether this connection stays open.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        "x-broadcast-trigger": "inline",
      },
      // keepalive helps the request survive even if the parent invocation
      // terminates earlier than expected.
      keepalive: true,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    // AbortError is expected and silent — the request left our side already.
    const name = err instanceof Error ? err.name : "";
    if (name !== "AbortError" && name !== "TimeoutError") {
      console.warn(
        "[broadcast-trigger] Trigger request failed (daily cron will retry):",
        err instanceof Error ? err.message : err
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

function resolveBaseUrl(): string | null {
  // Prefer an explicit, fully-qualified URL (set on Vercel prod to
  // https://magadhrecipe.com).
  const explicit = process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  // Fall back to Vercel's runtime-provided hostname for preview deploys.
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return null;
}
