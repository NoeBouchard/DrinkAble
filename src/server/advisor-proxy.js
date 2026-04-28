import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { runAdvisor } from './advisor-handler.js';
import { runShopRating } from './rating-handler.js';
import trackHandler from '../../api/track.js';

// Load .env.local manually (dotenv has issues with some ESM setups)
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env.local not found, rely on process.env */ }

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/advisor', async (req, res) => {
  const { userLat, userLng } = req.body || {};
  console.log(
    `[advisor] Request from (${userLat?.toFixed?.(4) || '?'}, ${userLng?.toFixed?.(4) || '?'})`
  );
  const result = await runAdvisor(req.body);
  if (result.status >= 400) {
    console.warn(`[advisor] ${result.status}:`, result.body.error);
  } else {
    console.log(
      `[advisor] Returned ${result.body.recommendations?.length || 0} recommendations`
    );
  }
  res.status(result.status).json(result.body);
});

app.post('/api/shop-rating', async (req, res) => {
  const shopName = req.body?.shop?.name || '?';
  console.log(`[shop-rating] Request for "${shopName}"`);
  const result = await runShopRating(req.body);
  if (result.status >= 400) {
    console.warn(`[shop-rating] ${result.status}:`, result.body.error);
  } else {
    console.log(`[shop-rating] Rated "${shopName}" => ${result.body.rating}`);
  }
  res.status(result.status).json(result.body);
});

// Telemetry forwarder — same default export as the Vercel function in api/track.js.
// Deliberately not logged per-event (noisy); see boot-time line below.
app.post('/api/track', (req, res) => trackHandler(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`DrinkAble Coffee Advisor running on port ${PORT}`);
  console.log(`  POST http://localhost:${PORT}/api/advisor`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set. Add it to .env.local');
  } else {
    console.log('  API key loaded');
  }
  console.log(
    `  ANALYTICS_WEBHOOK_URL ${process.env.ANALYTICS_WEBHOOK_URL ? 'loaded' : 'not set (track is a no-op)'}`
  );
});
