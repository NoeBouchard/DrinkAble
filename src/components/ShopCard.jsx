import { formatDistance, haversineDistance } from '../utils/distance';
import { scoreToPercentage } from '../utils/scoring';

/**
 * Individual shop card (Browse view).
 *
 * Props:
 * - shop: shop object
 * - userLat, userLng: user coordinates for distance display
 * - isSelected: boolean
 * - onClick: function — selects the shop
 * - onShopRating: function(shop) — opens "Why this one?" modal
 */
export function ShopCard({ shop, userLat, userLng, isSelected, onClick, onShopRating }) {
  const distance = haversineDistance(userLat, userLng, shop.lat, shop.lng);
  const scorePercent = scoreToPercentage(shop.compositeScore);

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border ${
        isSelected ? 'border-sage bg-sageLight/30' : 'border-sageLight bg-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg text-ink leading-tight truncate">{shop.name}</h3>
          <p className="text-sm text-inkSoft">{shop.neighborhood}</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-sageLight rounded-full text-ink whitespace-nowrap">
          {shop.priceRange}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-inkSoft uppercase tracking-wide">Match</span>
          <span className="text-sm font-semibold text-sageDeep">{scorePercent}</span>
        </div>
        <div className="w-full bg-sageLight rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all bg-sage"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Distance */}
      <div className="text-xs text-inkSoft mb-3 font-medium">
        📍 {formatDistance(distance)}
      </div>

      {/* Brew Methods */}
      {shop.brewMethods && shop.brewMethods.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {shop.brewMethods.slice(0, 4).map((method) => (
              <span
                key={method}
                className="text-xs bg-sageLight text-ink px-2 py-1 rounded-full"
              >
                {method}
              </span>
            ))}
            {shop.brewMethods.length > 4 && (
              <span className="text-xs text-inkSoft px-2 py-1">
                +{shop.brewMethods.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vibes */}
      {shop.vibes && shop.vibes.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {shop.vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className="text-xs bg-bg text-inkSoft px-2 py-1 rounded-full">
                {vibe}
              </span>
            ))}
            {shop.vibes.length > 3 && (
              <span className="text-xs text-inkSoft px-2 py-1">+{shop.vibes.length - 3}</span>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-ink mb-3 line-clamp-2">{shop.description}</p>

      <p className="text-xs text-inkSoft mb-3 italic line-clamp-2">{shop.specialtyFocus}</p>

      <div className="flex items-center justify-between text-xs text-inkSoft mb-3">
        <span>
          🏆 SCA <strong className="text-ink">{shop.scaScore}</strong>
        </span>
        <span>
          ⭐ Google <strong className="text-ink">{shop.googleRating.toFixed(1)}</strong>
        </span>
      </div>

      {(shop.hasWifi || shop.hasOutdoorSeating) && (
        <div className="flex gap-3 text-xs text-inkSoft mb-4">
          {shop.hasWifi && <span>📡 WiFi</span>}
          {shop.hasOutdoorSeating && <span>🪑 Outdoor</span>}
        </div>
      )}

      {/* "Why this one?" — replaces the old Shop Rating button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShopRating?.(shop);
        }}
        className="w-full bg-sage hover:bg-sageDeep text-white font-medium py-2.5 rounded-full transition-colors text-sm"
      >
        Why this one?
      </button>
    </div>
  );
}

export default ShopCard;
