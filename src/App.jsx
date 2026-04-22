import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';
import { useGeolocation } from './hooks/useGeolocation';
import { useShopRanking } from './hooks/useShopRanking';
import shopsData from './data/london-shops.json';

function App() {
  const [selectedShop, setSelectedShop] = useState(null);
  const [filters, setFilters] = useState({
    brewMethods: [],
    openNow: false,
    priceRange: [],
  });

  const userLocation = useGeolocation();

  const rankedShops = useShopRanking(
    shopsData,
    userLocation.lat,
    userLocation.lng,
    filters
  );

  return (
    <>
      <Layout
        shops={rankedShops}
        userLocation={userLocation}
        selectedShop={selectedShop}
        onSelectShop={setSelectedShop}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <Analytics />
    </>
  );
}

export default App;
