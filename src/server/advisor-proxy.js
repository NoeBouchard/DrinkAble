import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for Coffee Advisor
const SYSTEM_PROMPT = `You are a friendly, knowledgeable London coffee expert with deep knowledge of the city's specialty coffee scene. A user has asked for coffee shop recommendations near their current location.

You will receive their GPS coordinates and the 10 closest specialty coffee shops with full details including names, neighborhoods, SCA scores, Google ratings, brew methods, vibes, opening hours, and descriptions.

Your task: Recommend exactly 3 shops from the provided list. For each recommendation:
1. State the shop name and neighborhood
2. Give 2-3 specific reasons why it matches them based on:
   - Their current location and time (is it open now? convenient?)
   - Available brew methods and specialty focus
   - Vibes and atmosphere
3. Suggest what to order or experience

Be warm, encouraging, and specific. Mention details that show you understand the nuances of London's coffee culture. Your recommendations should feel like advice from a local coffee friend, not a ranked list.

Avoid generic praise. Instead of "Great coffee," say "Their seasonal single-origin pour-overs rotate monthly—ask about this month's Ethiopian Yirgacheffe."

If the user's location has no nearby shops within 5km, politely suggest expanding their search or offer alternatives.

Format your response as:
[Your personalized advice]

Then list the 3 recommendations in a clear format.`;

/**
 * POST /api/advisor
 * Coffee Advisor recommendation endpoint
 *
 * Request body:
 * {
 *   userLat: number,
 *   userLng: number,
 *   timeOfDay: string (ISO 8601),
 *   nearbyShops: array of shop objects (max 10)
 * }
 */
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
        error: 'ANTHROPIC_API_KEY not configured on server',
      });
    }

    // Format shop data for Claude
    const shopsContext = nearbyShops
      .map(
        (shop) =>
          `${shop.name} (${shop.neighborhood})
      - SCA Score: ${shop.scaScore}
      - Google Rating: ${shop.googleRating}
      - Brew Methods: ${shop.brewMethods.join(', ')}
      - Vibes: ${shop.vibes.join(', ')}
      - Price Range: ${shop.priceRange}
      - Open: ${shop.hours[getDayName(new Date())] || 'Closed'}
      - Description: ${shop.description}
      - Specialty: ${shop.specialtyFocus}`
      )
      .join('\n\n');

    const userMessage = `I'm currently at coordinates (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) in London at ${new Date(timeOfDay).toLocaleTimeString()}.

Here are the 10 closest specialty coffee shops to my location:

${shopsContext}

Please recommend exactly 3 shops from this list that would be perfect for me right now.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse recommendations (simple parsing - in production, use more robust parsing)
    const recommendations = parseRecommendations(responseText, nearbyShops);

    res.json({
      advice: responseText,
      recommendations,
    });
  } catch (error) {
    console.error('Coffee Advisor error:', error);

    if (error.status === 401) {
      return res.status(500).json({
        error: 'Invalid Anthropic API key',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limited. Please try again in a moment.',
      });
    }

    res.status(500).json({
      error: 'Failed to get recommendations from Coffee Advisor',
      details: error.message,
    });
  }
});

/**
 * Parse recommendations from Claude response
 * Extracts shop references and creates structured recommendation objects
 */
function parseRecommendations(responseText, nearbyShops) {
  const recommendations = [];

  // Look for shop names in the response
  for (const shop of nearbyShops) {
    if (responseText.includes(shop.name)) {
      // Extract reasoning (text after shop name)
      const shopIndex = responseText.indexOf(shop.name);
      const nextShopIndex = nearbyShops
        .filter((s) => s.id !== shop.id)
        .map((s) => responseText.indexOf(s.name))
        .filter((idx) => idx > shopIndex)
        .sort((a, b) => a - b)[0];

      const reasoningEnd = nextShopIndex > 0 ? nextShopIndex : responseText.length;
      const reasoning = responseText
        .substring(shopIndex, reasoningEnd)
        .replace(shop.name, '')
        .trim()
        .split('\n')[0]
        .substring(0, 200);

      recommendations.push({
        shopId: shop.id,
        shopName: shop.name,
        neighborhood: shop.neighborhood,
        reasoning: reasoning || 'An excellent specialty coffee destination.',
      });

      if (recommendations.length === 3) break;
    }
  }

  // If parsing failed, return the first 3 shops with generic reasoning
  if (recommendations.length === 0) {
    recommendations.push(
      ...nearbyShops.slice(0, 3).map((shop) => ({
        shopId: shop.id,
        shopName: shop.name,
        neighborhood: shop.neighborhood,
        reasoning: `${shop.description} Try their ${shop.brewMethods[0]} and ask about ${shop.specialtyFocus}.`,
      }))
    );
  }

  return recommendations;
}

/**
 * Get day name from date
 */
function getDayName(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ DrinkAble Coffee Advisor running on port ${PORT}`);
  console.log(`  POST http://localhost:${PORT}/api/advisor`);
  console.log(`  GET http://localhost:${PORT}/health`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠ WARNING: ANTHROPIC_API_KEY not set. Advisor will fail.');
    console.warn('  Set ANTHROPIC_API_KEY in .env before using the advisor.');
  }
});
