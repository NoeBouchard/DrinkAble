// Vercel serverless function for per-shop real-time rating.
import { runShopRating } from '../src/server/rating-handler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const result = await runShopRating(body);
  return res.status(result.status).json(result.body);
}

export const config = { maxDuration: 30 };
