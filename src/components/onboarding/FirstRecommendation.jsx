import { useEffect, useRef, useState } from 'react';
import { Logo, LogoLockup } from '../Logo';
import { directionsUrlForShop } from '../../utils/googleMaps';
import { haversineDistance, formatDistance } from '../../utils/distance';
import { computeCompositeScore } from '../../utils/scoring';
import { storage } from '../../utils/storage';
import { track, Events } from '../../utils/telemetry';

const API_URL = import.meta.env.PROD
  ? '/api/advisor'
  : 'http://localhost:3001/api/advisor';

function pickNearbyShops(shops, lat, lng, count = 10) {
  return [...shops]
    .map((shop) => ({
      ...shop,
      _composite: computeCompositeScore(shop, lat, lng),
      _distance: haversineDistance(lat, lng, shop.lat, shop.lng),
    }))
    .sort((a, b) => b._composite - a._composite)
    .slice(0, count);
}

function RecommendationCard({ rec, shopsById, userLat, userLng, isPrimary, fromToast }) {
  const shop = shopsById[rec.shopId];
  const directionsUrl = rec.googleMapsUrl || (shop ? directionsUrlForShop(shop) : null);
  const distance =
    shop && typeof userLat === 'number' && typeof userLng === 'number'
      ? haversineDistance(userLat, userLng, shop.lat, shop.lng)
      : null;

  const handleOpenMaps = () => {
    track(Events.GOOGLE_MAPS_OPENED, { shopId: rec.shopId, source: 'first_recommendation' });
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-sm ${
        isPrimary ? 'border-sage' : 'border-sageLight'
      }`}
    >
      {fromToast && (
        <p className="text-xs text-inkSoft mb-2">
          Using central London — grant location anytime from the menu.
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-medium text-ink leading-tight">{rec.shopName}</h3>
          <p className="text-sm text-inkSoft mt-0.5">{rec.neighborhood}</p>
        </div>
        {shop?.priceRange && (
          <span className="shrink-0 text-xs font-semibold px-3 py-1 bg-sageLight text-ink rounded-full">
            {shop.priceRange}
          </span>
        )}
      </div>

      <p className="mt-4 text-ink leading-relaxed text-[15px]">{rec.reasoning}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {distance !== null && (
          <span className="text-inkSoft">📍 {formatDistance(distance)} away</span>
        )}
        {shop?.brewMethods?.slice(0, 4).map((m) => (
          <span key={m} className="px-2 py-1 bg-sageLight text-ink rounded-full">
            {m}
          </span>
        ))}
      </div>

      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenMaps}
          className="mt-5 block w-full text-center bg-sage hover:bg-sageDeep text-white font-medium py-3 rounded-full transition-colors"
        >
          Open in Google Maps
        </a>
      )}
    </article>
  );
}

export function FirstRecommendation({
  shops,
  userLat,
  userLng,
  preferences,
  locationGranted,
  onContinue,
}) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const startedAt = useRef(Date.now());

  // Lookup table to pull full shop details (for distance, brews, maps URL fallback).
  const shopsById = Object.fromEntries(shops.map((s) => [s.id, s]));

  const fetchRec = async () => {
    setError(null);
    setResponse(null);
    setShowAll(false);
    startedAt.current = Date.now();

    try {
      const nearbyShops = pickNearbyShops(shops, userLat, userLng, 10);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLat,
          userLng,
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
      const latencyMs = Date.now() - startedAt.current;
      const topPickShopId = data.recommendations?.[0]?.shopId;
      track(Events.FIRST_RECOMMENDATION_RECEIVED, { topPickShopId, latencyMs });

      if (data.recommendations?.[0]) {
        const top = data.recommendations[0];
        storage.pushRecentRecommendation({
          query: '__first__',
          topPick: { shopId: top.shopId, shopName: top.shopName, neighborhood: top.neighborhood },
          timestamp: new Date().toISOString(),
        });
      }

      setResponse(data);
    } catch (err) {
      console.warn('[FirstRecommendation] error', err);
      setError(
        err.message === 'Failed to fetch'
          ? "The Advisor can't be reached. Make sure the server is running and try again."
          : err.message || "The Advisor is taking a moment. Try again?"
      );
    }
  };

  useEffect(() => {
    fetchRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recs = response?.recommendations || [];
  const top = recs[0];
  const rest = recs.slice(1);

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col px-6 py-10 sm:py-12 animate-screen-in">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <LogoLockup size={32} />
        </div>

        <h1 className="mt-8 text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
          Here's where you should go right now.
        </h1>

        {/* Loading */}
        {!response && !error && (
          <div className="mt-12 flex flex-col items-center text-center py-16">
            <div className="animate-logo-pulse">
              <Logo size={72} />
            </div>
            <p className="mt-6 text-inkSoft">
              Asking the Advisor for the perfect spot near you…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-10 bg-white border border-sageLight rounded-2xl p-6">
            <p className="font-medium text-ink mb-2">The Advisor is taking a moment.</p>
            <p className="text-sm text-inkSoft mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchRec}
              className="bg-sage hover:bg-sageDeep text-white font-medium px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Top pick */}
        {top && (
          <div className="mt-8">
            <RecommendationCard
              rec={top}
              shopsById={shopsById}
              userLat={userLat}
              userLng={userLng}
              isPrimary
              fromToast={!locationGranted}
            />

            {!showAll && rest.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-4 w-full text-center text-sage hover:text-sageDeep font-medium py-2 underline underline-offset-2"
              >
                See other suggestions
              </button>
            )}

            {showAll && rest.length > 0 && (
              <div className="mt-4 space-y-4">
                {rest.map((rec) => (
                  <RecommendationCard
                    key={rec.shopId}
                    rec={rec}
                    shopsById={shopsById}
                    userLat={userLat}
                    userLng={userLng}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue */}
        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={onContinue}
            className="w-full text-center text-inkSoft hover:text-ink py-3 text-sm underline underline-offset-2"
          >
            Continue to Drinkable
          </button>
        </div>
      </div>
    </div>
  );
}

export default FirstRecommendation;
