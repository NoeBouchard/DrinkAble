import Anthropic from '@anthropic-ai/sdk';

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
    { "shopName": "Exact shop name from the list", "neighborhood": "Neighborhood", "reasoning": "Your 2-3 sentence specific reasoning" },
    { "shopName": "...", "neighborhood": "...", "reasoning": "..." },
    { "shopName": "...", "neighborhood": "...", "reasoning": "..." }
  ]
}

Return ONLY valid JSON, no markdown fences or extra text.`;

function getDayName(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

/**
 * Shared advisor handler, reused by both Express (local dev) and Vercel
 * serverless function. Accepts a plain body object and returns either
 * `{ status, body }` where body is the JSON to serialize.
 */
export async function runAdvisor(body) {
  const { userLat, userLng, timeOfDay, nearbyShops } = body || {};

  if (!userLat || !userLng || !nearbyShops) {
    return {
      status: 400,
      body: { error: 'Missing required fields: userLat, userLng, nearbyShops' },
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: 500,
      body: {
        error:
          'ANTHROPIC_API_KEY not configured on server. Add it to your environment (local: .env.local, Vercel: project env vars).',
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content[0]?.text || '';

    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        advice: responseText,
        recommendations: nearbyShops.slice(0, 3).map((shop) => ({
          shopName: shop.name,
          neighborhood: shop.neighborhood,
          reasoning: `${shop.description} Try their ${shop.brewMethods[0]}.`,
        })),
      };
    }

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

    return {
      status: 200,
      body: {
        advice: parsed.advice || responseText,
        recommendations,
      },
    };
  } catch (error) {
    if (error.status === 401) {
      return { status: 500, body: { error: 'Invalid Anthropic API key.' } };
    }
    if (error.status === 429) {
      return {
        status: 429,
        body: { error: 'Rate limited. Please try again in a moment.' },
      };
    }
    const apiMsg = error.error?.error?.message || error.message || '';
    if (apiMsg.includes('credit balance')) {
      return {
        status: 402,
        body: {
          error:
            'Anthropic API credits depleted. Please add credits at console.anthropic.com.',
        },
      };
    }
    return {
      status: 500,
      body: { error: apiMsg || 'Failed to get recommendations. Please try again.' },
    };
  }
}
