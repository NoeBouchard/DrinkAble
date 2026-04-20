/**
 * Haversine formula to calculate great-circle distance between two lat/lng points
 * Returns distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 * Returns string like "0.5 km" or "1.2 km"
 */
export function formatDistance(km) {
  if (km < 0.1) return '<0.1 km';
  return `${km.toFixed(1)} km`;
}
