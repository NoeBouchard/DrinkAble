import { formatDistance, haversineDistance } from '../utils/distance';
import { scoreToPercentage, getScoreColor, getScoreTextColor } from '../utils/scoring';

/**
 * Individual shop card component
 *
 * Props:
 * - shop: shop object with id, name, neighborhood, scaScore, googleRating, etc.
 * - userLat, userLng: user coordinates for distance calculation
 * - isSelected: boolean
 * - onClick: function
 */
export function ShopCard({ shop, userLat, userLng, isSelected, onClick, onAskAdvisor }) {
  const distance = haversineDistance(userLat, userLng, shop.lat, shop.lng);
  const scorePercent = scoreToPercentage(shop.compositeScore);
  const scoreColor = getScoreColor(scorePercent);
  const scoreTextColor = getScoreTextColor(scorePercent);

  return (
    <div
      onClick={onClick}
      className={`rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-4 border-2 ${
        isSelected ? 'border-coffee-700 bg-coffee-50' : 'border-transparent bg-white'
      }`}
    >
      {/* Header: Name and Neighborhood Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{shop.name}</h3>
          <p className="text-sm text-gray-600">{shop.neighborhood}</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-full text-gray-700 whitespace-nowrap">
          {shop.priceRange}
        </div>
      </div>

      {/* Composite Score Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">Relevance Score</span>
          <span className={`text-sm font-bold ${scoreTextColor}`}>{scorePercent}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${scoreColor}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Distance */}
      <div className="text-xs text-gray-600 mb-3 font-medium">
        📍 {formatDistance(distance)}
      </div>

      {/* Brew Methods Tags */}
      {shop.brewMethods && shop.brewMethods.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {shop.brewMethods.slice(0, 4).map((method) => (
              <span
                key={method}
                className="text-xs bg-coffee-100 text-coffee-800 px-2 py-1 rounded"
              >
                {method}
              </span>
            ))}
            {shop.brewMethods.length > 4 && (
              <span className="text-xs text-gray-600 px-2 py-1">
                +{shop.brewMethods.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vibes Tags */}
      {shop.vibes && shop.vibes.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {shop.vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {vibe}
              </span>
            ))}
            {shop.vibes.length > 3 && (
              <span className="text-xs text-gray-600 px-2 py-1">+{shop.vibes.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{shop.description}</p>

      {/* Specialty Focus */}
      <p className="text-xs text-gray-600 mb-3 italic">{shop.specialtyFocus}</p>

      {/* Ratings */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        <span>
          🏆 SCA: <strong>{shop.scaScore}</strong>
        </span>
        <span>
          ⭐ Google: <strong>{shop.googleRating.toFixed(1)}</strong>
        </span>
      </div>

      {/* Amenities */}
      <div className="flex gap-3 text-xs text-gray-600 mb-4">
        {shop.hasWifi && <span>📡 WiFi</span>}
        {shop.hasOutdoorSeating && <span>🪑 Outdoor</span>}
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAskAdvisor?.();
        }}
        className="w-full bg-coffee-700 text-white font-medium py-2 rounded hover:bg-coffee-800 transition-colors text-sm"
      >
        Ask Advisor
      </button>
    </div>
  );
}

export default ShopCard;
