import { useState, useRef, useEffect } from 'react';
import { Map } from './Map';
import { ShopList } from './ShopList';
import { FilterBar } from './FilterBar';
import { ShopRatingModal } from './ShopRatingModal';
import { LogoLockup } from './Logo';

/**
 * Browse view — secondary surface. Map + ranked list + filters.
 * Reached via "Browse all shops" or a recommendation card's "Show on map".
 */
export function Layout({
  shops,
  userLocation,
  selectedShop,
  onSelectShop,
  filters,
  onFiltersChange,
  onBackToAdvisor,
}) {
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const ratingRef = useRef(null);

  const handleShopRating = (shop) => {
    ratingRef.current?.rate(shop);
  };

  useEffect(() => {
    if (!userLocation.error || toastDismissed) return;
    const t = setTimeout(() => setToastDismissed(true), 6000);
    return () => clearTimeout(t);
  }, [userLocation.error, toastDismissed]);

  const showGeoToast = userLocation.error && !toastDismissed;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-bg overflow-hidden">
      {/* Geolocation fallback toast */}
      {showGeoToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className="bg-sageLight border border-sage/40 text-ink rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-[90vw]">
            <span className="text-lg">📍</span>
            <p className="text-sm">
              Location unavailable — using <strong>central London</strong>.
            </p>
            <button
              onClick={() => setToastDismissed(true)}
              className="ml-1 text-inkSoft hover:text-ink text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Map — single instance */}
      <div
        className={`${
          showMapOnMobile ? 'absolute inset-0 z-20' : 'hidden lg:block'
        } lg:relative lg:w-3/5 h-full`}
      >
        <Map
          shops={shops}
          userLocation={userLocation}
          selectedShop={selectedShop}
          onSelectShop={(id) => {
            onSelectShop(id);
            setShowMapOnMobile(false);
          }}
        />
      </div>

      {/* Mobile Map Toggle */}
      <div className="lg:hidden fixed top-20 right-4 z-30">
        <button
          onClick={() => setShowMapOnMobile(!showMapOnMobile)}
          className="bg-sage text-white px-4 py-2 rounded-full shadow-lg hover:bg-sageDeep font-medium text-sm min-h-[44px]"
        >
          {showMapOnMobile ? 'List' : 'Map'}
        </button>
      </div>

      {/* List + Filters column */}
      <div className="flex flex-col lg:w-2/5 h-full bg-bg">
        {/* Header */}
        <div className="bg-white border-b border-sageLight px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToAdvisor}
              className="text-sm font-medium text-inkSoft hover:text-ink flex items-center gap-1.5"
            >
              <span aria-hidden>←</span>
              <span>Back to Advisor</span>
            </button>
            <LogoLockup size={32} />
          </div>
          <p className="text-xs text-inkSoft mt-1">Browse all London specialty shops.</p>
        </div>

        <FilterBar filters={filters} onFiltersChange={onFiltersChange} />

        <div className="flex-1 overflow-hidden">
          <ShopList
            shops={shops}
            selectedShop={selectedShop}
            onSelectShop={onSelectShop}
            userLat={userLocation.lat}
            userLng={userLocation.lng}
            isLoading={userLocation.loading}
            onShopRating={handleShopRating}
          />
        </div>

        <div className="bg-white border-t border-sageLight px-4 sm:px-6 py-2 text-xs text-inkSoft">
          Showing {shops.length} shop{shops.length !== 1 ? 's' : ''}
          {userLocation.error && (
            <span className="ml-2 text-sageDeep">Using London fallback</span>
          )}
        </div>
      </div>

      {/* Per-shop "Why this one?" modal — preserved from Session 4 */}
      <ShopRatingModal ref={ratingRef} userLocation={userLocation} />
    </div>
  );
}

export default Layout;
