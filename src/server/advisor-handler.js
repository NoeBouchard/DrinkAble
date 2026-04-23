import Anthropic from '@anthropic-ai/sdk';

const BASE_SYSTEM_PROMPT = `You are a friendly, knowledgeable London coffee expert with deep knowledge of the city's specialty coffee scene. A user has asked for coffee shop recommendations near their current location.

You will receive their GPS coordinates and the closest specialty coffee shops with full details including names, neighborhoods, SCA scores, Google ratings, brew methods, vibes, opening hours, and descriptions.

Your task: Recommend exactly 3 shops from the provided list. For each recommendation:
1. State the shop name and neighborhood
2. Give 2-3 specific reasons why it matches them based on their current location and time, available brew methods, vibes, and opening hours
3. Suggest what to order or experience

Be warm, encouraging, and specific. Mention details that show you understand the nuances of London's coffee culture. Your recommendations should feel like advice from a local coffee friend, not a ranked list.

Avoid generic praise. Instead of "Great coffee," say "Their seasonal single-origin pour-overs rotate monthly — ask about this month's Ethiopian Yirgacheffe."

NEVER recommend a shop that doesn't exist in the provided list.

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

function buildSystemPrompt(preferences) {
  const drinks = preferences?.drinks?.filter(Boolean) || [];
  const priorities = preferences?.priorities?.filter(Boolean) || [];

  if (drinks.length === 0 && priorities.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  const drinkLine =
    drinks.length > 0
      ? `The user has told us they usually drink: ${drinks.join(', ')}.`
      : '';
  const priorityLine =
    priorities.length > 0
      ? `When picking a coffee shop they care most about: ${priorities.join('; ')}.`
      : '';

  const weighting = `Weight your recommendations to favour shops that match these preferences — but never recommend a shop that doesn't exist in the provided list. If a shop matches a preference, name the matching dimension explicitly in your reasoning (e.g. "their V60 program is the standout — exactly what you said you drink").`;

  return `${BASE_SYSTEM_PROMPT}\n\nUSER PREFERENCES:\n${[drinkLine, priorityLine, weighting]
    .filter(Boolean)
    .join('\n')}`;
}

function getDayName(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

function buildGoogleMapsUrl(shop) {
  if (!shop || typeof shop.lat !== 'number' || typeof shop.lng !== 'number') return null;
  const params = new URLSearchParams({
    api: '1',
    destination: shop.name
      ? `${shop.name}, ${shop.lat},${shop.lng}`
      : `${shop.lat},${shop.lng}`,
  });
  if (shop.googlePlaceId || shop.placeId) {
    params.set('destination_place_id', shop.googlePlaceId || shop.placeId);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Shared advisor handler, reused by both Express (local dev) and Vercel
 * serverless function. Accepts a plain body object and returns
 * `{ status, body }` where body is the JSON to serialize.
 *
 * Body fields:
 * - userLat, userLng (required)
 * - nearbyShops (required): array of shop objects
 * - timeOfDay (optional): ISO 8601 timestamp
 * - query (optional): user's natural-language prompt
 * - preferences (optional): { drinks: string[], priorities: string[] }
 */
export async function runAdvisor(body) {
  const { userLat, userLng, timeOfDay, nearbyShops, query, preferences } = body || {};

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

    const candidateShops = nearbyShops.slice(0, 10);

    const shopsContext = candidateShops
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

    const queryLine = query
      ? `The user asked: "${query.trim()}"\n\nRecommend exactly 3 shops that best answer this, drawn from the list below.`
      : `Recommend exactly 3 shops for me right now.`;

    const userMessage = `I'm at (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) in London. It's ${timeStr} on ${now.toLocaleDateString('en-GB', { weekday: 'long' })}.

${queryLine}

Here are the closest specialty coffee shops:

${shopsContext}`;

    const systemPrompt = buildSystemPrompt(preferences);

    if (process.env.NODE_ENV !== 'production') {
      const drinks = preferences?.drinks?.filter(Boolean) || [];
      const priorities = preferences?.priorities?.filter(Boolean) || [];
      console.log(
        `[advisor-handler] preferences → drinks=[${drinks.join(',')}] priorities=[${priorities.join(',')}] query="${(query || '').slice(0, 80)}"`
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
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
        recommendations: candidateShops.slice(0, 3).map((shop) => ({
          shopName: shop.name,
          neighborhood: shop.neighborhood,
          reasoning: `${shop.description} Try their ${shop.brewMethods[0]}.`,
        })),
      };
    }

    const recommendations = (parsed.recommendations || []).map((rec) => {
      const match = candidateShops.find(
        (s) => s.name.toLowerCase() === rec.shopName?.toLowerCase()
      );
      return {
        shopId: match?.id || rec.shopName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        shopName: rec.shopName,
        neighborhood: rec.neighborhood,
        reasoning: rec.reasoning,
        googleMapsUrl: match ? buildGoogleMapsUrl(match) : null,
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
