import { useEffect, useRef } from 'react';
import { ShopCard } from './ShopCard';

export function ShopList({ shops, selectedShop, onSelectShop, userLat, userLng, isLoading, onAskAdvisor }) {
  const listRef = useRef(null);

  // Auto-scroll to selected shop (e.g. when clicking a map marker)
  useEffect(() => {
    if (!selectedShop || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-shop-id="${selectedShop}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedShop]);

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
          <div className="text-3xl mb-2">&#x2615;</div>
          <p className="font-medium">No shops match your filters</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto h-full p-4 space-y-3 bg-gray-50">
      {shops.map((shop) => (
        <div key={shop.id} data-shop-id={shop.id}>
          <ShopCard
            shop={shop}
            userLat={userLat}
            userLng={userLng}
            isSelected={selectedShop === shop.id}
            onClick={() => onSelectShop(shop.id)}
            onAskAdvisor={onAskAdvisor}
          />
        </div>
      ))}
    </div>
  );
}

export default ShopList;
