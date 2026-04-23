import { haversineDistance } from './distance';

/**
 * Compute composite score for one shop based on:
 * - 40% SCA Score (specialty quality)
 * - 30% Google Rating (user satisfaction)
 * - 30% Proximity (distance from user)
 */
export function computeCompositeScore(shop, userLat, userLng) {
  const distanceKm = haversineDistance(userLat, userLng, shop.lat, shop.lng);

  // Normalize SCA score (0-100) to 0-1
  const normalizedSCA = shop.scaScore / 100;

  // Normalize Google rating (1-5) to 0-1
  const normalizedGoogle = shop.googleRating / 5.0;

  // Proximity score: max(0, 1 - distance/5km)
  // Shops within 5km get full proximity bonus, beyond 5km get 0
  const maxRadius = 5.0;
  const proximityScore = Math.max(0, 1 - distanceKm / maxRadius);

  // Composite score
  const score = (0.4 * normalizedSCA) + (0.3 * normalizedGoogle) + (0.3 * proximityScore);

  return parseFloat(score.toFixed(3));
}

/**
 * Convert composite score (0-1) to 0-100 scale for display
 */
export function scoreToPercentage(compositeScore) {
  return Math.round(compositeScore * 100);
}

/**
 * Check if shop is open at given time
 * Returns true if shop.hours contains opening hours for the day
 */
export function isOpenAtTime(shop, date = new Date()) {
  const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
  const hoursStr = shop.hours[dayName];

  if (!hoursStr || hoursStr === 'closed') return false;

  try {
    const [openStr, closeStr] = hoursStr.split('-');
    const openTime = timeToMinutes(openStr);
    const closeTime = timeToMinutes(closeStr);
    const currentTime = date.getHours() * 60 + date.getMinutes();

    return currentTime >= openTime && currentTime < closeTime;
  } catch (e) {
    return false;
  }
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Filter shops by brew methods (shop must have ALL selected methods)
 */
export function filterByBrewMethods(shops, brewMethods) {
  if (!brewMethods || brewMethods.length === 0) return shops;
  return shops.filter((shop) =>
    brewMethods.every((method) => shop.brewMethods.includes(method))
  );
}

/**
 * Filter shops by price range
 */
export function filterByPriceRange(shops, priceRanges) {
  if (!priceRanges || priceRanges.length === 0) return shops;
  return shops.filter((shop) => priceRanges.includes(shop.priceRange));
}

/**
 * Filter shops that are open now
 */
export function filterByOpenNow(shops, openNow = false) {
  if (!openNow) return shops;
  return shops.filter((shop) => isOpenAtTime(shop));
}

/**
 * Apply all filters and return filtered shops
 */
export function applyFilters(shops, filters = {}) {
  let result = shops;

  if (filters.brewMethods && filters.brewMethods.length > 0) {
    result = filterByBrewMethods(result, filters.brewMethods);
  }

  if (filters.priceRange && filters.priceRange.length > 0) {
    result = filterByPriceRange(result, filters.priceRange);
  }

  if (filters.openNow) {
    result = filterByOpenNow(result, true);
  }

  return result;
}
