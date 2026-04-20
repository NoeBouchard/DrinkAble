// Vercel serverless function for the Coffee Advisor.
// In production, Vercel routes POST /api/advisor to this handler.
import { runAdvisor } from '../src/server/advisor-handler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel parses JSON bodies automatically when Content-Type is application/json,
  // but guard against string bodies just in case.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const result = await runAdvisor(body);
  return res.status(result.status).json(result.body);
}

export const config = {
  maxDuration: 30,
};
