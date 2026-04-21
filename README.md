# DrinkAble

**Find your next perfect cup**

A specialty coffee shop discovery web app for London. Discover hidden gems, find specialty roasters near you, and get personalized recommendations from an AI Coffee Advisor.

## Features

- 🗺️ **Interactive Map**: Explore 45+ London specialty coffee shops on Mapbox GL JS
- 📍 **Smart Ranking**: Shops ranked by composite score (SCA quality + user rating + proximity)
- 🎯 **Live Filters**: Filter by brew method, open now, price range
- ✨ **AI Advisor**: Ask Claude for personalized recommendations
- 📱 **Mobile-First**: Fully responsive design, touch-friendly
- 🏪 **Detailed Profiles**: SCA scores, brew methods, vibes, hours, amenities

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Map**: Mapbox GL JS
- **AI**: Claude API (Anthropic)
- **Server**: Express.js + Vercel Serverless
- **Data**: Static JSON (upgradeable to Supabase)

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd drinkable
npm install
```

### 2. Get API Keys

**Mapbox Token:**
- Go to https://account.mapbox.com
- Create free account, generate token
- Copy token

**Anthropic API Key:**
- Go to https://console.anthropic.com
- Create account, generate API key
- Copy key

### 3. Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_MAPBOX_TOKEN=pk_eyJ1IjoiYnJld3Njb3V0IiwiYSI6ImNrMzV4...
ANTHROPIC_API_KEY=sk-ant-v0-1234...
```

### 4. Run Development Server

```bash
npm run dev
```

Opens http://localhost:5173

### 5. (Optional) Run Coffee Advisor Server

In a separate terminal:

```bash
npm run server
```

Starts Express proxy on http://localhost:3001

## Development Sessions

This project is built across 4 development sessions:

### Session 1: Foundation
- ✅ Vite + React + Tailwind setup
- ✅ Data loading from JSON
- ✅ Geolocation hook
- ✅ Composite scoring algorithm
- ✅ ShopCard, ShopList, FilterBar components
- ✅ Ranking and filtering working

### Session 2: Map Integration
- Mapbox GL JS integration
- Marker clustering
- Real-time filter sync
- Mobile responsive toggle

### Session 3: AI Advisor
- Express proxy server
- Claude API integration
- Chat-like UI
- Streaming recommendations

### Session 4: Polish & Deploy
- Mobile UX finalization
- Loading skeletons
- Error states
- PWA manifest
- Service worker
- Vercel deployment

**For detailed prompts, see `CLAUDE_CODE_GUIDE.md`**

## Project Structure

```
drinkable/
├── TECHNICAL_SPEC.md           # Architecture & detailed spec
├── CLAUDE_CODE_GUIDE.md        # Exact prompts for each session
├── package.json
├── vite.config.js
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── data/
│   │   └── london-shops.json   # 45 specialty shops
│   ├── components/
│   │   ├── Map.jsx
│   │   ├── ShopCard.jsx
│   │   ├── ShopList.jsx
│   │   ├── FilterBar.jsx
│   │   ├── CoffeeAdvisor.jsx
│   │   └── Layout.jsx
│   ├── hooks/
│   │   ├── useGeolocation.js
│   │   └── useShopRanking.js
│   ├── utils/
│   │   ├── scoring.js
│   │   └── distance.js
│   └── server/
│       └── advisor-proxy.js
└── public/
    └── manifest.json
```

## Composite Scoring Algorithm

Shops are ranked by a composite score combining:

- **40%** SCA Score (specialty quality, 0-100)
- **30%** Google Rating (user satisfaction, 1-5)
- **30%** Proximity (distance from user, 0-5km radius)

Formula:
```
compositeScore = (0.40 × SCA/100) + (0.30 × Rating/5) + (0.30 × proximity)
```

## API Endpoints

### Coffee Advisor

```
POST /api/advisor

Request:
{
  "userLat": 51.5074,
  "userLng": -0.1278,
  "timeOfDay": "2024-03-14T14:30:00Z",
  "nearbyShops": [...]
}

Response:
{
  "advice": "You are in a great location...",
  "recommendations": [
    {
      "shopId": "prufrock-coffee",
      "shopName": "Prufrock Coffee",
      "neighborhood": "Clerkenwell",
      "reasoning": "Just 0.4km away..."
    },
    ...
  ]
}
```

## Filtering

**Brew Methods**: espresso, v60, aeropress, chemex, siphon, batch-brew, cold-brew, pour-over

**Price Ranges**: $ (£2-4), $$ (£4-6), $$$ (£6+)

**Open Now**: Toggle to show only currently open shops

## London Coffee Landmarks Included

- Prufrock Coffee (Clerkenwell)
- Monmouth Coffee (Borough Market, Covent Garden)
- Ozone Coffee Roasters (Shoreditch)
- Caravan Coffee (King's Cross, Bankside)
- Workshop Coffee (Clerkenwell, Marylebone)
- Climpson & Sons (Hackney)
- Nude Espresso (Brick Lane, Soho)
- Assembly Coffee (Brixton)
- And 37 more...

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set environment variables in Vercel dashboard:
- VITE_MAPBOX_TOKEN
- ANTHROPIC_API_KEY

### Build Locally

```bash
npm run build
npm run preview
```

## Future Enhancements

- [ ] User authentication & saved favorites
- [ ] Supabase integration for user reviews
- [ ] Real-time hours from Google Places API
- [ ] Photo gallery per shop
- [ ] Event calendar (cupping, tasting events)
- [ ] Export route planner (visit N shops in one afternoon)
- [ ] Expand to other cities (Paris, Berlin, Tokyo, etc.)

## Contributing

See `TECHNICAL_SPEC.md` for detailed architecture.

## License

MIT

## Support

- **Technical Questions**: See `TECHNICAL_SPEC.md`
- **Session Prompts**: See `CLAUDE_CODE_GUIDE.md`
- **Issues**: Check component TODO comments

---

**Built for specialty coffee enthusiasts. By specialty coffee enthusiasts.**
