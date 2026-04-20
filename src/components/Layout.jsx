import { useState, useRef, useEffect } from 'react';
import { Map } from './Map';
import { ShopList } from './ShopList';
import { FilterBar } from './FilterBar';
import { CoffeeAdvisor } from './CoffeeAdvisor';

export function Layout({
  shops,
  userLocation,
  selectedShop,
  onSelectShop,
  filters,
  onFiltersChange,
}) {
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const advisorRef = useRef(null);

  const topShops = shops.slice(0, 10);

  const handleAskAdvisor = () => {
    advisorRef.current?.ask();
  };

  // Auto-dismiss the geolocation fallback toast after 6s
  useEffect(() => {
    if (!userLocation.error || toastDismissed) return;
    const t = setTimeout(() => setToastDismissed(true), 6000);
    return () => clearTimeout(t);
  }, [userLocation.error, toastDismissed]);

  const showGeoToast = userLocation.error && !toastDismissed;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-white overflow-hidden">
      {/* Geolocation fallback toast */}
      {showGeoToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-[90vw]">
            <span className="text-lg">📍</span>
            <p className="text-sm">
              Location unavailable — using <strong>Central London</strong> as fallback.
            </p>
            <button
              onClick={() => setToastDismissed(true)}
              className="ml-1 text-yellow-700 hover:text-yellow-900 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Map — single instance, shown on desktop always, toggleable on mobile */}
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

      {/* Mobile Map Toggle Button */}
      <div className="lg:hidden fixed top-20 right-4 z-30">
        <button
          onClick={() => setShowMapOnMobile(!showMapOnMobile)}
          className="bg-coffee-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-coffee-800 font-medium text-sm min-h-[44px]"
        >
          {showMapOnMobile ? 'List' : 'Map'}
        </button>
      </div>

      {/* List and Filters */}
      <div className="flex flex-col lg:w-2/5 h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">DrinkAble</h1>
          <p className="text-sm sm:text-base text-gray-600">Find your next perfect cup</p>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFiltersChange={onFiltersChange} />

        {/* Shop List */}
        <div className="flex-1 overflow-hidden">
          <ShopList
            shops={shops}
            selectedShop={selectedShop}
            onSelectShop={onSelectShop}
            userLat={userLocation.lat}
            userLng={userLocation.lng}
            isLoading={userLocation.loading}
            onAskAdvisor={handleAskAdvisor}
          />
        </div>

        {/* Results Summary */}
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-3 text-xs text-gray-600">
          Showing {shops.length} shop{shops.length !== 1 ? 's' : ''}
          {userLocation.error && (
            <span className="ml-2 text-yellow-600">Using London fallback</span>
          )}
        </div>
      </div>

      {/* Coffee Advisor */}
      <CoffeeAdvisor ref={advisorRef} userLocation={userLocation} topShops={topShops} />
    </div>
  );
}

export default Layout;
