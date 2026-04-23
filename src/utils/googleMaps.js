/**
 * Google Maps directions URL helpers.
 *
 * The /maps/dir/ endpoint accepts a destination and an optional place_id
 * for higher-precision matching. Our shop data only has lat/lng for now,
 * so place_id is omitted unless explicitly passed.
 */

export function buildDirectionsUrl({ lat, lng, placeId, name }) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const params = new URLSearchParams({
    api: '1',
    destination: `${lat},${lng}`,
  });

  if (placeId) {
    params.set('destination_place_id', placeId);
  } else if (name) {
    // Falling back to name biases Google's match toward the right venue.
    params.set('destination', `${name}, ${lat},${lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function directionsUrlForShop(shop) {
  if (!shop) return null;
  return buildDirectionsUrl({
    lat: shop.lat,
    lng: shop.lng,
    placeId: shop.googlePlaceId || shop.placeId,
    name: shop.name,
  });
}

export default { buildDirectionsUrl, directionsUrlForShop };
