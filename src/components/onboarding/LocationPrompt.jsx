import { useState } from 'react';
import { storage } from '../../utils/storage';
import { track, Events } from '../../utils/telemetry';

const LONDON_FALLBACK = { lat: 51.5074, lng: -0.1278 };

export function LocationPrompt({ onResolved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const useMyLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      storage.setLocationPermission('denied');
      track(Events.LOCATION_DENIED, { reason: 'unsupported' });
      onResolved({ ...LONDON_FALLBACK, granted: false });
      return;
    }

    setBusy(true);

    const timeoutId = setTimeout(() => {
      setBusy(false);
      setError("Location is taking a moment — using central London for now.");
      storage.setLocationPermission('denied');
      track(Events.LOCATION_DENIED, { reason: 'timeout' });
      onResolved({ ...LONDON_FALLBACK, granted: false });
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setBusy(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        storage.setLocationPermission('granted');
        track(Events.LOCATION_GRANTED, coords);
        onResolved({ ...coords, granted: true });
      },
      (err) => {
        clearTimeout(timeoutId);
        setBusy(false);
        storage.setLocationPermission('denied');
        track(Events.LOCATION_DENIED, { code: err.code });
        onResolved({ ...LONDON_FALLBACK, granted: false });
      },
      { timeout: 7000, enableHighAccuracy: false }
    );
  };

  const useLondon = () => {
    storage.setLocationPermission('denied');
    track(Events.LOCATION_DENIED, { reason: 'opted_out' });
    onResolved({ ...LONDON_FALLBACK, granted: false });
  };

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col px-6 py-10 sm:py-16 animate-screen-in">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <p className="text-xs font-medium text-inkSoft uppercase tracking-wider">Step 3 of 3</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
          Where are you right now?
        </h1>
        <p className="mt-3 text-inkSoft text-base">
          We'll use your location to find shops nearby. You can change this anytime.
        </p>

        {error && (
          <div className="mt-6 bg-sageLight/60 border border-sage/30 text-ink rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="mt-auto pt-12 flex flex-col items-start gap-4">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy}
            className="w-full sm:w-auto sm:px-12 py-3.5 rounded-full font-medium text-base bg-sage hover:bg-sageDeep text-white transition-colors disabled:opacity-70"
          >
            {busy ? 'Locating…' : 'Use my location'}
          </button>
          <button
            type="button"
            onClick={useLondon}
            disabled={busy}
            className="text-sm text-inkSoft hover:text-ink underline underline-offset-2"
          >
            Use central London instead
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationPrompt;
