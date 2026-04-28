// Telemetry forwarder.
// In production, Vercel routes POST /api/track here.
// In dev, src/server/advisor-proxy.js mounts the same default export.
//
// Behaviour:
//   - OPTIONS  → 204 (CORS preflight)
//   - non-POST → 405
//   - missing ANALYTICS_WEBHOOK_URL → 204 (no-op so dev w/o secret still works)
//   - POST     → fire-and-forget to Apps Script webhook, 3s timeout, always 204

const FORWARD_TIMEOUT_MS = 3000;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhook = process.env.ANALYTICS_WEBHOOK_URL;
  if (!webhook) {
    return res.status(204).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

  try {
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    });
    if (!upstream.ok) {
      console.warn(`[track] upstream ${upstream.status}`);
    }
  } catch (err) {
    console.warn('[track] forward failed:', err?.name || err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }

  return res.status(204).end();
}

export const config = { maxDuration: 10 };
