// Unexpected failures emit only a generated correlation ID and a fixed event.
// Never log request bodies, query strings, headers or exception/provider text.
export async function handleUnexpected(run, message) {
  try { return await run(); }
  catch {
    const requestId = crypto.randomUUID();
    try { console.error(JSON.stringify({ event: 'unexpected_error', requestId })); } catch { /* Logging must not break the response boundary. */ }
    return new Response(message, { status: 500, headers: {
      'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'X-Request-ID': requestId,
    } });
  }
}
