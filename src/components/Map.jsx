import { useEffect, useRef, useState } from 'react';

/**
 * Map component - Mapbox GL JS integration
 * TODO (Session 2): Integrate Mapbox GL JS
 *
 * Props:
 * - shops: array of shop objects
 * - userLocation: { lat, lng }
 * - selectedShop: string (shop id) or null
 * - onSelectShop: function(shopId)
 */
export function Map({ shops, userLocation, selectedShop, onSelectShop }) {
  const mapContainer = useRef(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    setHasToken(!!token);
  }, []);

  if (!hasToken) {
    return (
      <div
        ref={mapContainer}
        className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
      >
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Map coming soon</h2>
          <p className="text-gray-600 mb-4">
            To integrate Mapbox GL JS, add your token to <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code>
          </p>
          <p className="text-sm text-gray-500">
            Get a free token at <a href="https://account.mapbox.com" className="text-blue-600 hover:underline">mapbox.com</a>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Map markers will cluster and sync with the list once integrated in Session 2
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="relative w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"
    >
      <div className="text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <p className="text-gray-700 font-medium">Map initialized - awaiting Mapbox setup</p>
        <p className="text-sm text-gray-600 mt-2">Session 2: Full Mapbox GL integration coming</p>
      </div>
    </div>
  );
}

export default Map;
