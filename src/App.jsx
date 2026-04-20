import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { useGeolocation } from './hooks/useGeolocation';
import { useShopRanking } from './hooks/useShopRanking';

/**
 * Root App Component
 * Orchestrates data loading, geolocation, ranking, and filtering
 */
function App() {
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);

  const [filters, setFilters] = useState({
    brewMethods: [],
    openNow: false,
    priceRange: [],
  });

  const userLocation = useGeolocation();

  // Rank shops based on user location and filters
  const rankedShops = useShopRanking(
    shops,
    userLocation.lat,
    userLocation.lng,
    filters
  );

  // Load shops data
  useEffect(() => {
    const loadShops = async () => {
      try {
        setShopsLoading(true);
        const response = await fetch('/src/data/london-shops.json');
        const data = await response.json();
        setShops(data);
        setShopsLoading(false);
      } catch (error) {
        console.error('Error loading shops:', error);
        setShopsError('Failed to load shops data');
        setShopsLoading(false);
      }
    };

    loadShops();
  }, []);

  return (
    <Layout
      shops={rankedShops}
      userLocation={{
        ...userLocation,
        loading: shopsLoading || userLocation.loading,
      }}
      selectedShop={selectedShop}
      onSelectShop={setSelectedShop}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
}

export default App;
