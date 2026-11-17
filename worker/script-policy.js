// Authorize only the inline scripts contained in this trusted static asset.
export async function scriptPolicy(html, policy) {
  const hashes = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi)) {
    if (/\bsrc\s*=/i.test(match[1]) || !match[2].trim()) continue;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(match[2]));
    hashes.add(`'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`);
  }
  return policy.replace(/script-src([^;]*)/, (_, sources) => `script-src${sources} ${[...hashes].join(" ")}`);
}
