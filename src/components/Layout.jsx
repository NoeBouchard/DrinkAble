import { useState, useRef, useEffect } from 'react';
import { Map } from './Map';
import { ShopList } from './ShopList';
import { FilterBar } from './FilterBar';
import { ShopRatingModal } from './ShopRatingModal';
import { LogoLockup } from './Logo';
import { TopNav } from './TopNav';

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
    <div className="flex flex-col h-screen w-screen bg-bg overflow-hidden">
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

      {/* Top bar — same height & padding as AdvisorHome so switching views doesn't shift layout */}
      <header className="shrink-0 bg-bg/90 backdrop-blur-sm border-b border-sageLight/60">
        <div className="px-5 sm:px-8 py-3 flex items-center justify-between gap-3">
          <LogoLockup size={32} />
          <TopNav
            active="map"
            onNavigate={(target) => {
              if (target === 'home') onBackToAdvisor();
            }}
          />
        </div>
      </header>

      {/* Map + List body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
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
        <div className="lg:hidden absolute top-3 right-4 z-30">
          <button
            onClick={() => setShowMapOnMobile(!showMapOnMobile)}
            className="bg-sage text-white px-4 py-2 rounded-full shadow-lg hover:bg-sageDeep font-medium text-sm min-h-[44px]"
          >
            {showMapOnMobile ? 'List' : 'Show map'}
          </button>
        </div>

        {/* List + Filters column */}
        <div className="flex flex-col lg:w-2/5 h-full bg-bg">
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
      </div>

      {/* Per-shop "Why this one?" modal — preserved from Session 4 */}
      <ShopRatingModal ref={ratingRef} userLocation={userLocation} />
    </div>
  );
}

export default Layout;
