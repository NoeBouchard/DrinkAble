import { useEffect, useMemo, useRef, useState } from 'react';
import { LogoLockup, Logo } from './Logo';
import { TopNav } from './TopNav';
import { storage } from '../utils/storage';
import { track, Events } from '../utils/telemetry';
import { directionsUrlForShop } from '../utils/googleMaps';
import { computeCompositeScore } from '../utils/scoring';
import { haversineDistance, formatDistance } from '../utils/distance';

const API_URL = '/api/advisor';

const QUICK_PROMPTS = [
  'A quiet place to work nearby',
  'Best flat white within 10 min walk',
  'Try somewhere I haven\u2019t been',
  'Open right now, seat for 2',
];

function pickNearbyShops(shops, lat, lng, count = 10) {
  return [...shops]
    .map((shop) => ({
      ...shop,
      _composite: computeCompositeScore(shop, lat, lng),
    }))
    .sort((a, b) => b._composite - a._composite)
    .slice(0, count);
}

function RecommendationCard({ rec, shopsById, userLat, userLng, onShowOnMap }) {
  const shop = shopsById[rec.shopId];
  const directionsUrl = rec.googleMapsUrl || (shop ? directionsUrlForShop(shop) : null);
  const distance =
    shop && typeof userLat === 'number' && typeof userLng === 'number'
      ? haversineDistance(userLat, userLng, shop.lat, shop.lng)
      : null;

  const handleOpenMaps = () => {
    track(Events.GOOGLE_MAPS_OPENED, { shopId: rec.shopId, source: 'advisor_home' });
  };

  return (
    <article className="rounded-2xl border border-sageLight bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-medium text-ink leading-tight">{rec.shopName}</h3>
          <p className="text-sm text-inkSoft mt-0.5">{rec.neighborhood}</p>
        </div>
        {shop?.priceRange && (
          <span className="shrink-0 text-xs font-semibold px-3 py-1 bg-sageLight text-ink rounded-full">
            {shop.priceRange}
          </span>
        )}
      </div>

      <p className="mt-3 text-ink leading-relaxed text-[15px]">{rec.reasoning}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {distance !== null && (
          <span className="text-inkSoft">📍 {formatDistance(distance)} away</span>
        )}
        {shop?.brewMethods?.slice(0, 4).map((m) => (
          <span key={m} className="px-2 py-1 bg-sageLight text-ink rounded-full">
            {m}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenMaps}
            className="flex-1 text-center bg-sage hover:bg-sageDeep text-white font-medium py-2.5 rounded-full transition-colors text-sm"
          >
            Open in Google Maps
          </a>
        )}
        {shop && (
          <button
            type="button"
            onClick={() => onShowOnMap(shop.id)}
            className="flex-1 text-center bg-sageLight hover:bg-sage hover:text-white text-ink font-medium py-2.5 rounded-full transition-colors text-sm"
          >
            Show on map
          </button>
        )}
      </div>
    </article>
  );
}

export function AdvisorHome({ shops, userLocation, onOpenBrowse }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [recents, setRecents] = useState(() => storage.getRecentRecommendations());
  const inputRef = useRef(null);

  const preferences = useMemo(() => storage.getPreferences(), []);
  const shopsById = useMemo(
    () => Object.fromEntries(shops.map((s) => [s.id, s])),
    [shops]
  );

  const submit = async (rawQuery) => {
    const q = (rawQuery ?? query).trim();
    if (!q || busy) return;

    setBusy(true);
    setError(null);
    setResponse(null);

    track(Events.ADVISOR_QUERY_SUBMITTED, {
      query: q,
      hasPreferences:
        (preferences?.drinks?.length || 0) + (preferences?.priorities?.length || 0) > 0,
    });

    try {
      const nearbyShops = pickNearbyShops(shops, userLocation.lat, userLocation.lng, 10);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          timeOfDay: new Date().toISOString(),
          nearbyShops,
          preferences,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResponse(data);

      if (data.recommendations?.[0]) {
        const top = data.recommendations[0];
        storage.pushRecentRecommendation({
          query: q,
          topPick: { shopId: top.shopId, shopName: top.shopName, neighborhood: top.neighborhood },
          timestamp: new Date().toISOString(),
        });
        setRecents(storage.getRecentRecommendations());
      }
    } catch (err) {
      console.warn('[AdvisorHome] error', err);
      setError(
        err.message === 'Failed to fetch'
          ? "The Advisor can't be reached. Make sure the server is running."
          : err.message || 'The Advisor is taking a moment. Try again?'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const handlePromptChip = (prompt) => {
    setQuery(prompt);
    inputRef.current?.focus();
  };

  const handleShowOnMap = (shopId) => {
    onOpenBrowse(shopId);
  };

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col overflow-y-auto">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-sageLight/60">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-3">
          <LogoLockup size={32} />
          <TopNav
            active="home"
            onNavigate={(target) => {
              if (target === 'map') onOpenBrowse(null);
            }}
          />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
          What are you looking for right now?
        </h1>
        <p className="mt-2 text-inkSoft">
          Tap a quick start, or describe your perfect cup in your own words.
        </p>

        {/* Quick-prompt chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptChip(prompt)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-sageLight text-ink hover:bg-sage hover:text-white transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="advisor-query" className="sr-only">
            Ask the Advisor
          </label>
          <div className="flex items-center gap-2 bg-white border border-sageLight rounded-full px-4 py-2 focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/30 transition-shadow shadow-sm">
            <input
              id="advisor-query"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Or type anything — e.g. 'filter coffee, not too busy, outdoor seating'"
              className="flex-1 bg-transparent text-ink placeholder-inkSoft/70 outline-none text-sm sm:text-base"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!query.trim() || busy}
              aria-label="Ask"
              className="shrink-0 bg-sage hover:bg-sageDeep disabled:bg-sageLight disabled:text-inkSoft text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>

        {/* Loading */}
        {busy && (
          <div className="mt-10 flex flex-col items-center text-center py-10">
            <div className="animate-logo-pulse">
              <Logo size={48} />
            </div>
            <p className="mt-4 text-inkSoft text-sm">Asking the Advisor…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 bg-white border border-sageLight rounded-2xl p-5">
            <p className="font-medium text-ink mb-2">The Advisor is taking a moment.</p>
            <p className="text-sm text-inkSoft mb-4">{error}</p>
            <button
              type="button"
              onClick={() => submit(query)}
              className="bg-sage hover:bg-sageDeep text-white font-medium px-5 py-2 rounded-full transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Recommendations */}
        {response?.recommendations?.length > 0 && (
          <section className="mt-8 space-y-4">
            {response.advice && (
              <p className="text-ink leading-relaxed">{response.advice}</p>
            )}
            {response.recommendations.map((rec) => (
              <RecommendationCard
                key={rec.shopId}
                rec={rec}
                shopsById={shopsById}
                userLat={userLocation.lat}
                userLng={userLocation.lng}
                onShowOnMap={handleShowOnMap}
              />
            ))}
          </section>
        )}

        {/* Recent recommendations */}
        {!response && recents.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium text-inkSoft uppercase tracking-wider mb-3">
              Recent recommendations
            </h2>
            <ul className="space-y-2">
              {recents.slice(0, 3).map((entry, i) => (
                <li
                  key={`${entry.timestamp}-${i}`}
                  className="bg-white border border-sageLight rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {entry.topPick?.shopName || 'A pick'}
                    </p>
                    <p className="text-xs text-inkSoft truncate">
                      {entry.query === '__first__'
                        ? 'Your first recommendation'
                        : entry.query}
                    </p>
                  </div>
                  {entry.topPick?.shopId && (
                    <button
                      type="button"
                      onClick={() => handleShowOnMap(entry.topPick.shopId)}
                      className="shrink-0 text-xs text-sageDeep hover:text-ink underline underline-offset-2"
                    >
                      Show on map
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdvisorHome;
