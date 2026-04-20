import { useState } from 'react';
import { Map } from './Map';
import { ShopList } from './ShopList';
import { FilterBar } from './FilterBar';
import { CoffeeAdvisor } from './CoffeeAdvisor';

/**
 * Main layout wrapper
 * Responsive: Desktop (map left 60%, list right 40%), Mobile (list full, map toggleable)
 *
 * Props:
 * - shops: array of shops (with compositeScore added)
 * - userLocation: { lat, lng, loading, error }
 * - selectedShop: string (shop id) or null
 * - onSelectShop: function(shopId)
 * - filters: { brewMethods, openNow, priceRange }
 * - onFiltersChange: function(newFilters)
 */
export function Layout({
  shops,
  userLocation,
  selectedShop,
  onSelectShop,
  filters,
  onFiltersChange,
}) {
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);

  // Get top 10 shops for advisor
  const topShops = shops.slice(0, 10);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-white overflow-hidden">
      {/* Map */}
      <div className="hidden lg:flex lg:w-3/5 h-full relative">
        <Map
          shops={shops}
          userLocation={userLocation}
          selectedShop={selectedShop}
          onSelectShop={onSelectShop}
        />
      </div>

      {/* Mobile Map Toggle Button */}
      <div className="lg:hidden absolute top-20 right-4 z-30">
        <button
          onClick={() => setShowMapOnMobile(!showMapOnMobile)}
          className="bg-coffee-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-coffee-800 font-medium text-sm"
        >
          {showMapOnMobile ? '📋 List' : '🗺️ Map'}
        </button>
      </div>

      {/* Mobile Map Overlay */}
      {showMapOnMobile && (
        <div className="lg:hidden absolute inset-0 z-20 h-screen">
          <Map
            shops={shops}
            userLocation={userLocation}
            selectedShop={selectedShop}
            onSelectShop={onSelectShop}
          />
        </div>
      )}

      {/* List and Filters */}
      <div className="flex flex-col lg:w-2/5 h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">DrinkAble</h1>
          <p className="text-gray-600">Find your next perfect cup</p>
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
          />
        </div>

        {/* Results Summary */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-600">
          Showing {shops.length} shop{shops.length !== 1 ? 's' : ''}
          {userLocation.error && (
            <span className="ml-2 text-yellow-600">
              • Using London fallback location
            </span>
          )}
        </div>
      </div>

      {/* Coffee Advisor FAB */}
      <CoffeeAdvisor userLocation={userLocation} topShops={topShops} />
    </div>
  );
}

export default Layout;
