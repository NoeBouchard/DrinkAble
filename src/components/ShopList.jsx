import { ShopCard } from './ShopCard';

/**
 * Scrollable ranked list of coffee shops
 *
 * Props:
 * - shops: array of ranked shop objects
 * - selectedShop: string (shop id) or null
 * - onSelectShop: function(shopId)
 * - userLat, userLng: user coordinates
 * - isLoading: boolean
 */
export function ShopList({ shops, selectedShop, onSelectShop, userLat, userLng, isLoading }) {
  if (isLoading) {
    return (
      <div className="overflow-y-auto h-full p-4 space-y-4 bg-gray-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg bg-white p-4 shadow animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full mb-3" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="overflow-y-auto h-full p-4 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-3xl mb-2">☕</div>
          <p className="font-medium">No shops match your filters</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-4 space-y-3 bg-gray-50">
      {shops.map((shop) => (
        <ShopCard
          key={shop.id}
          shop={shop}
          userLat={userLat}
          userLng={userLng}
          isSelected={selectedShop === shop.id}
          onClick={() => onSelectShop(shop.id)}
        />
      ))}
    </div>
  );
}

export default ShopList;
