import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a London specialty coffee expert giving a real-time, specific, unfiltered rating of a single coffee shop. A user wants your take on THIS shop, right now.

You will receive one shop's full profile (name, neighborhood, SCA score, Google rating, brew methods, vibes, opening hours, description, specialty) and the user's current time and rough location.

Your job: produce a candid mini-review. Be specific, warm, and honest. Mention what makes this shop distinctive, when it's at its best, and who it's actually for. Avoid generic praise ("great coffee!") — instead cite specific things like the brew methods they're known for, whether the space suits solo work or conversation, how their seasonal rotations work, or a known dish/drink to try.

If the shop is closed right now, say so clearly and suggest the best time to come back.

IMPORTANT: Return ONLY valid JSON, no markdown fences or extra text, in this exact shape:
{
  "rating": "8.5/10",
  "headline": "One-line verdict (under 12 words)",
  "summary": "2-3 sentence honest take on the shop",
  "whatToOrder": "One specific drink or item to try, with why",
  "bestFor": "Who this shop is for right now (e.g. 'morning solo flat-white', 'afternoon work session', 'weekend pastry hunt')",
  "insiderTip": "One thing a local would know that a tourist wouldn't",
  "openNow": true
}

- rating is your own 0-10 score, one decimal place, factoring SCA score, Google rating, vibes fit, and time-of-day appropriateness.
- openNow is a boolean reflecting whether the shop is currently serving based on the hours provided.`;

function getDayName(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

export async function runShopRating(body) {
  const { shop, userLat, userLng, timeOfDay } = body || {};

  if (!shop || !shop.name) {
    return { status: 400, body: { error: 'Missing required field: shop' } };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: 500,
      body: {
        error:
          'ANTHROPIC_API_KEY not configured on server. Add it to your environment.',
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const now = timeOfDay ? new Date(timeOfDay) : new Date();
    const dayName = getDayName(now);
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const hoursToday = shop.hours?.[dayName] || 'closed';

    const locationLine =
      typeof userLat === 'number' && typeof userLng === 'number'
        ? `The user is at (${userLat.toFixed(4)}, ${userLng.toFixed(4)}).`
        : 'The user is somewhere in London.';

    const userMessage = `${locationLine} It's ${timeStr} on ${now.toLocaleDateString('en-GB', { weekday: 'long' })}.

Rate this shop:

Name: ${shop.name}
Neighborhood: ${shop.neighborhood}
SCA score: ${shop.scaScore}
Google rating: ${shop.googleRating}
Price: ${shop.priceRange}
Brew methods: ${shop.brewMethods?.join(', ') || 'unknown'}
Vibes: ${shop.vibes?.join(', ') || 'unknown'}
Today's hours: ${hoursToday}
Amenities: ${[shop.hasWifi && 'wifi', shop.hasOutdoorSeating && 'outdoor seating'].filter(Boolean).join(', ') || 'none listed'}
Description: ${shop.description}
Specialty focus: ${shop.specialtyFocus}

Give me your honest, specific, real-time verdict.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
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
        rating: `${Math.round(shop.googleRating * 2) / 2 * 2}/10`,
        headline: 'A solid London specialty stop.',
        summary: responseText || shop.description,
        whatToOrder: `Try their ${shop.brewMethods?.[0] || 'house espresso'}.`,
        bestFor: shop.vibes?.[0] || 'a coffee break',
        insiderTip: 'Ask the baristas what they are brewing today.',
        openNow: hoursToday !== 'closed',
      };
    }

    return {
      status: 200,
      body: {
        shopId: shop.id,
        shopName: shop.name,
        neighborhood: shop.neighborhood,
        ...parsed,
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
          error: 'Anthropic API credits depleted. Please add credits at console.anthropic.com.',
        },
      };
    }
    return {
      status: 500,
      body: { error: apiMsg || 'Failed to get shop rating. Please try again.' },
    };
  }
}
