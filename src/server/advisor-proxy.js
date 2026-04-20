import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Load .env.local manually (dotenv has issues with some setups)
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env.local not found, rely on process.env */ }

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

const SYSTEM_PROMPT = `You are a friendly, knowledgeable London coffee expert with deep knowledge of the city's specialty coffee scene. A user has asked for coffee shop recommendations near their current location.

You will receive their GPS coordinates and the 10 closest specialty coffee shops with full details including names, neighborhoods, SCA scores, Google ratings, brew methods, vibes, opening hours, and descriptions.

Your task: Recommend exactly 3 shops from the provided list. For each recommendation:
1. State the shop name and neighborhood
2. Give 2-3 specific reasons why it matches them based on their current location and time, available brew methods, vibes, and opening hours
3. Suggest what to order or experience

Be warm, encouraging, and specific. Mention details that show you understand the nuances of London's coffee culture. Your recommendations should feel like advice from a local coffee friend, not a ranked list.

Avoid generic praise. Instead of "Great coffee," say "Their seasonal single-origin pour-overs rotate monthly — ask about this month's Ethiopian Yirgacheffe."

IMPORTANT: Structure your response as valid JSON with this exact format:
{
  "advice": "Your opening paragraph of personalized advice (2-3 sentences)",
  "recommendations": [
    {
      "shopName": "Exact shop name from the list",
      "neighborhood": "Neighborhood",
      "reasoning": "Your 2-3 sentence specific reasoning for this recommendation"
    },
    {
      "shopName": "...",
      "neighborhood": "...",
      "reasoning": "..."
    },
    {
      "shopName": "...",
      "neighborhood": "...",
      "reasoning": "..."
    }
  ]
}

Return ONLY valid JSON, no markdown fences or extra text.`;

function getDayName(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

app.post('/api/advisor', async (req, res) => {
  try {
    const { userLat, userLng, timeOfDay, nearbyShops } = req.body;

    if (!userLat || !userLng || !nearbyShops) {
      return res.status(400).json({
        error: 'Missing required fields: userLat, userLng, nearbyShops',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY not configured on server. Add it to .env.local',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const now = timeOfDay ? new Date(timeOfDay) : new Date();
    const dayName = getDayName(now);
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const shopsContext = nearbyShops
      .slice(0, 10)
      .map((shop, i) => {
        const hours = shop.hours?.[dayName] || 'closed';
        return `${i + 1}. ${shop.name} (${shop.neighborhood})
   SCA: ${shop.scaScore} | Google: ${shop.googleRating} | Price: ${shop.priceRange}
   Brew: ${shop.brewMethods.join(', ')}
   Vibes: ${shop.vibes.join(', ')}
   Today's hours: ${hours}
   ${shop.description}
   Specialty: ${shop.specialtyFocus}`;
      })
      .join('\n\n');

    const userMessage = `I'm at (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) in London. It's ${timeStr} on ${now.toLocaleDateString('en-GB', { weekday: 'long' })}.

Here are the 10 closest specialty coffee shops:

${shopsContext}

Recommend exactly 3 shops for me right now.`;

    console.log(`[advisor] Request from (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) at ${timeStr}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content[0]?.text || '';
    console.log(`[advisor] Response received (${responseText.length} chars)`);

    // Parse JSON response from Claude
    let parsed;
    try {
      // Strip markdown fences if present
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[advisor] Failed to parse JSON, using raw text');
      // Fallback: return raw text as advice with best-effort recommendations
      parsed = {
        advice: responseText,
        recommendations: nearbyShops.slice(0, 3).map((shop) => ({
          shopName: shop.name,
          neighborhood: shop.neighborhood,
          reasoning: `${shop.description} Try their ${shop.brewMethods[0]}.`,
        })),
      };
    }

    // Match shopIds from our data
    const recommendations = (parsed.recommendations || []).map((rec) => {
      const match = nearbyShops.find(
        (s) => s.name.toLowerCase() === rec.shopName?.toLowerCase()
      );
      return {
        shopId: match?.id || rec.shopName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        shopName: rec.shopName,
        neighborhood: rec.neighborhood,
        reasoning: rec.reasoning,
      };
    });

    res.json({
      advice: parsed.advice || responseText,
      recommendations,
    });
  } catch (error) {
    console.error('[advisor] Error:', error.message);

    if (error.status === 401) {
      return res.status(500).json({ error: 'Invalid Anthropic API key.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limited. Please try again in a moment.' });
    }

    // Surface the actual API error message if available
    const apiMsg = error.error?.error?.message || error.message || '';
    if (apiMsg.includes('credit balance')) {
      return res.status(402).json({
        error: 'Anthropic API credits depleted. Please add credits at console.anthropic.com.',
      });
    }

    res.status(500).json({
      error: apiMsg || 'Failed to get recommendations. Please try again.',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  });
});

app.listen(PORT, () => {
  console.log(`DrinkAble Coffee Advisor running on port ${PORT}`);
  console.log(`  POST http://localhost:${PORT}/api/advisor`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set. Add it to .env.local');
  } else {
    console.log('  API key loaded');
  }
});
