/**
 * fetch wrapper that throws on non-2xx responses.
 *
 * Plain `fetch` only rejects on network failure — an HTTP 400/500 still
 * resolves, so optimistic-update handlers that only roll back inside `catch`
 * never revert when the server rejects a mutation. Routing mutations through
 * `apiFetch` makes a failed request throw, so existing try/catch rollback logic
 * fires correctly and the UI stays in sync with the database.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.clone().json();
      if (body?.error || body?.message) message = body.error || body.message;
    } catch {
      /* response had no JSON body — keep the status-code message */
    }
    throw new Error(message);
  }
  return res;
}
