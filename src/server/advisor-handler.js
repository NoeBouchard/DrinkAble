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

// Maps the Q2 priority chip labels (shown to users in
// src/components/onboarding/Q2Priorities.jsx) to the structured boolean
// signals stored on each shop in src/data/london-shops.json.
const PRIORITY_TO_SIGNAL = Object.freeze({
  'Roaster-owned': 'roastsOwnBeans',
  'Recognized globally (top 100)': 'worldTop100',
  'Certified specialty-grade': 'specialtyCertified',
});

/**
 * Map free-text priorities → structured signal keys. Anything that doesn't
 * correspond to a structured field (e.g. "Discovering new independents",
 * "Great vibe to work in", "Quick in-and-out") is silently dropped — those
 * still flow to Claude via the prompt's USER PREFERENCES block.
 */
function priorityChipsToSignals(priorities) {
  return priorities
    .map((p) => PRIORITY_TO_SIGNAL[p])
    .filter(Boolean);
}

/**
 * Prefilter the candidate set by the user's structured Q2 priorities BEFORE
 * sending to Claude. Three-tier fallback so the user always gets at least 3
 * candidates if possible:
 *
 *   1. Strict — shop must match ALL requested signals.
 *   2. Relaxed — shop must match AT LEAST ONE requested signal.
 *   3. Unfiltered — fall back to the original nearbyShops; flag relaxed=true
 *      so the UI can surface "no perfect matches, here are the closest".
 *
 * Always returns up to 10 candidates. filterInfo is returned alongside for
 * telemetry + system-prompt customisation + UI surfacing.
 */
function selectCandidates(nearbyShops, preferences) {
  const priorities = preferences?.priorities?.filter(Boolean) || [];
  const requestedSignals = priorityChipsToSignals(priorities);

  if (requestedSignals.length === 0) {
    const candidates = nearbyShops.slice(0, 10);
    return {
      candidates,
      filterInfo: {
        requestedSignals: [],
        strictMatchCount: nearbyShops.length,
        returnedCount: candidates.length,
        relaxed: false,
      },
    };
  }

  const strict = nearbyShops.filter((shop) =>
    requestedSignals.every((sig) => shop[sig] === true)
  );

  if (strict.length >= 3) {
    const candidates = strict.slice(0, 10);
    return {
      candidates,
      filterInfo: {
        requestedSignals,
        strictMatchCount: strict.length,
        returnedCount: candidates.length,
        relaxed: false,
      },
    };
  }

  const relaxed = nearbyShops.filter((shop) =>
    requestedSignals.some((sig) => shop[sig] === true)
  );

  if (relaxed.length >= 3) {
    const candidates = relaxed.slice(0, 10);
    return {
      candidates,
      filterInfo: {
        requestedSignals,
        strictMatchCount: strict.length,
        returnedCount: candidates.length,
        relaxed: true,
      },
    };
  }

  const candidates = nearbyShops.slice(0, 10);
  return {
    candidates,
    filterInfo: {
      requestedSignals,
      strictMatchCount: strict.length,
      returnedCount: candidates.length,
      relaxed: true,
    },
  };
}

function buildSystemPrompt(preferences, filterInfo) {
  const drinks = preferences?.drinks?.filter(Boolean) || [];
  const priorities = preferences?.priorities?.filter(Boolean) || [];
  const filtered = filterInfo?.requestedSignals?.length > 0;

  if (drinks.length === 0 && priorities.length === 0 && !filtered) {
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

  const filterLine = !filtered
    ? ''
    : filterInfo.relaxed
      ? `Note: the candidate list below could not be strictly pre-filtered to all of the user's structured priorities (${filterInfo.requestedSignals.join(', ')}) within their nearby radius. The list is the closest available matches; acknowledge this gracefully if a recommendation doesn't fully satisfy a priority.`
      : `All candidate shops below have been pre-filtered to match the user's structured priorities: ${filterInfo.requestedSignals.join(', ')}. Do NOT re-litigate the filter in your reasoning; instead, focus on which shop best fits the user's query, time of day, and free-text priorities.`;

  const weighting = `Weight your recommendations to favour shops that match these preferences — but never recommend a shop that doesn't exist in the provided list. If a shop matches a preference, name the matching dimension explicitly in your reasoning (e.g. "their V60 program is the standout — exactly what you said you drink").`;

  return `${BASE_SYSTEM_PROMPT}\n\nUSER PREFERENCES:\n${[drinkLine, priorityLine, filterLine, weighting]
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
 * Body fields (request):
 * - userLat, userLng (required)
 * - nearbyShops (required): array of shop objects, pre-ranked by the client
 * - timeOfDay (optional): ISO 8601 timestamp
 * - query (optional): user's natural-language prompt
 * - preferences (optional): { drinks: string[], priorities: string[] }
 *
 * Response body:
 * - advice: string
 * - recommendations: [{ shopId, shopName, neighborhood, reasoning, googleMapsUrl }]
 * - filterInfo: { requestedSignals, strictMatchCount, returnedCount, relaxed }
 *     Surfaced so the client can emit `advisor_filter_applied` telemetry and
 *     so a future UI line can explain when relaxed=true.
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

    const { candidates: candidateShops, filterInfo } = selectCandidates(
      nearbyShops,
      preferences
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[drinkable:advisor_filter_applied] ${JSON.stringify(filterInfo)}`
      );
    }

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

    const systemPrompt = buildSystemPrompt(preferences, filterInfo);

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
        filterInfo,
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
