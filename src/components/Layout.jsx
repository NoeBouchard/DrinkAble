import { useState } from 'react';
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

  const topShops = shops.slice(0, 10);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-white overflow-hidden">
      {/* Map — single instance, shown on desktop always, toggleable on mobile */}
      <div
        className={`${
          showMapOnMobile
            ? 'absolute inset-0 z-20'
            : 'hidden lg:block'
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
          className="bg-coffee-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-coffee-800 font-medium text-sm"
        >
          {showMapOnMobile ? 'List' : 'Map'}
        </button>
      </div>

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
              Using London fallback location
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
