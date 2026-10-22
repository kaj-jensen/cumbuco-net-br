export async function readLimited(request, max) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > max) throw new Response("Request is too large.", { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new Response("Request is too large.", { status: 413 }); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
export async function requestGate(request, env, binding = "ENQUIRY_RATE_LIMIT") {
  if (!sameOrigin(request)) return new Response("Invalid request origin.", { status: 403 });
  if (!env[binding]) return new Response("Please try again shortly.", { status: 503 });
  try {
    const key = new URL(request.url).pathname + ":" + (request.headers.get("CF-Connecting-IP") || "unknown");
    const { success } = await env[binding].limit({ key });
    if (!success) return new Response("Too many requests. Please try again shortly.", { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
  } catch { return new Response("Please try again shortly.", { status: 503 }); }
  return null;
}
