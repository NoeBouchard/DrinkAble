import { useEffect, useState } from 'react';
import { storage } from '../../utils/storage';
import { track, Events } from '../../utils/telemetry';
import SplashScreen from './SplashScreen';
import Q1Drinks from './Q1Drinks';
import Q2Priorities from './Q2Priorities';
import LocationPrompt from './LocationPrompt';
import FirstRecommendation from './FirstRecommendation';

/**
 * OnboardingFlow runs splash → Q1 → Q2 → location → first recommendation.
 * Persists to localStorage as the user advances so reloads resume from the
 * last incomplete step.
 *
 * The post-recommendation feature-interest survey (screen 6) is rendered
 * by the App on top of AdvisorHome — not from inside this flow — because
 * the spec says the user lands on the home screen first and the survey is
 * a non-blocking modal layered on top.
 */
const STEPS = ['splash', 'q1', 'q2', 'location', 'first_rec'];

function pickResumeStep(prefs) {
  if (!prefs) return 'splash';
  if (!prefs.drinks || prefs.drinks.length === 0) return 'q1';
  if (!prefs.priorities || prefs.priorities.length === 0) {
    // Q2 is optional — if drinks are saved but onboarded flag isn't,
    // treat the user as having reached at least Q2.
    return 'q2';
  }
  return 'location';
}

export function OnboardingFlow({ shops, onComplete }) {
  const stored = storage.getPreferences();
  const [step, setStep] = useState(() => {
    if (stored?.drinks?.length) return pickResumeStep(stored);
    return 'splash';
  });

  const [drinks, setDrinks] = useState(stored?.drinks || []);
  const [priorities, setPriorities] = useState(stored?.priorities || []);
  const [coords, setCoords] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    track(Events.ONBOARDING_STARTED);
  }, []);

  const goto = (next) => {
    if (STEPS.includes(next)) setStep(next);
  };

  const handleSplashContinue = () => goto('q1');

  const handleQ1 = (selected) => {
    setDrinks(selected);
    storage.setPreferences({ drinks: selected, priorities, completedAt: null });
    track(Events.Q1_SUBMITTED, { drinks: selected });
    goto('q2');
  };

  const handleQ2 = (selected) => {
    setPriorities(selected);
    storage.setPreferences({ drinks, priorities: selected, completedAt: null });
    track(Events.Q2_SUBMITTED, { priorities: selected });
    goto('location');
  };

  const handleQ2Skip = () => {
    setPriorities([]);
    storage.setPreferences({ drinks, priorities: [], completedAt: null });
    track(Events.Q2_SUBMITTED, { priorities: [], skipped: true });
    goto('location');
  };

  const handleLocationResolved = ({ lat, lng, granted }) => {
    setCoords({ lat, lng });
    setLocationGranted(granted);
    goto('first_rec');
  };

  const handleFirstRecContinue = () => {
    storage.setPreferences({
      drinks,
      priorities,
      completedAt: new Date().toISOString(),
    });
    storage.setOnboarded();
    track(Events.ONBOARDING_COMPLETED);
    onComplete({ coords, locationGranted });
  };

  switch (step) {
    case 'q1':
      return <Q1Drinks initial={drinks} onContinue={handleQ1} />;
    case 'q2':
      return (
        <Q2Priorities
          initial={priorities}
          onContinue={handleQ2}
          onSkip={handleQ2Skip}
        />
      );
    case 'location':
      return <LocationPrompt onResolved={handleLocationResolved} />;
    case 'first_rec':
      return (
        <FirstRecommendation
          shops={shops}
          userLat={coords?.lat ?? 51.5074}
          userLng={coords?.lng ?? -0.1278}
          preferences={{ drinks, priorities }}
          locationGranted={locationGranted}
          onContinue={handleFirstRecContinue}
        />
      );
    case 'splash':
    default:
      return <SplashScreen onContinue={handleSplashContinue} />;
  }
}

export default OnboardingFlow;
