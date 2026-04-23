import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';
import { AdvisorHome } from './components/AdvisorHome';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { FeatureInterestSurvey } from './components/onboarding/FeatureInterestSurvey';
import { useGeolocation } from './hooks/useGeolocation';
import { useShopRanking } from './hooks/useShopRanking';
import { storage } from './utils/storage';
import { track, Events } from './utils/telemetry';
import shopsData from './data/london-shops.json';

const VIEWS = {
  ONBOARDING: 'onboarding',
  ADVISOR: 'advisor',
  BROWSE: 'browse',
};

function App() {
  const [view, setView] = useState(() =>
    storage.isOnboarded() ? VIEWS.ADVISOR : VIEWS.ONBOARDING
  );
  const [showFeatureSurvey, setShowFeatureSurvey] = useState(false);

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

  useEffect(() => {
    if (view !== VIEWS.BROWSE) return;
    track(Events.BROWSE_VIEW_OPENED);
  }, [view]);

  const handleOnboardingComplete = () => {
    setView(VIEWS.ADVISOR);
    setShowFeatureSurvey(true);
  };

  const handleOpenBrowse = (shopId) => {
    if (shopId) setSelectedShop(shopId);
    setView(VIEWS.BROWSE);
  };

  const handleBackToAdvisor = () => {
    setView(VIEWS.ADVISOR);
  };

  return (
    <>
      {view === VIEWS.ONBOARDING && (
        <OnboardingFlow
          shops={shopsData}
          onComplete={handleOnboardingComplete}
        />
      )}

      {view === VIEWS.ADVISOR && (
        <AdvisorHome
          shops={shopsData}
          userLocation={userLocation}
          onOpenBrowse={handleOpenBrowse}
        />
      )}

      {view === VIEWS.BROWSE && (
        <Layout
          shops={rankedShops}
          userLocation={userLocation}
          selectedShop={selectedShop}
          onSelectShop={setSelectedShop}
          filters={filters}
          onFiltersChange={setFilters}
          onBackToAdvisor={handleBackToAdvisor}
        />
      )}

      {showFeatureSurvey && (
        <FeatureInterestSurvey onClose={() => setShowFeatureSurvey(false)} />
      )}

      <Analytics />
    </>
  );
}

export default App;
