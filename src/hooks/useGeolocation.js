import { useState, useEffect } from 'react';

const LONDON_CENTER = {
  lat: 51.5074,
  lng: -0.1278,
};

/**
 * Custom hook for browser geolocation with fallback to central London
 * Returns { lat, lng, error, loading }
 */
export function useGeolocation(options = {}) {
  const [location, setLocation] = useState({
    lat: LONDON_CENTER.lat,
    lng: LONDON_CENTER.lng,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const { timeout = 5000, enableHighAccuracy = false } = options;

    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'geolocation_unavailable',
        loading: false,
      }));
      return;
    }

    const timeoutId = setTimeout(() => {
      setLocation((prev) => ({
        ...prev,
        error: 'timeout',
        loading: false,
      }));
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        // Fallback to London center on any error
        setLocation((prev) => ({
          lat: LONDON_CENTER.lat,
          lng: LONDON_CENTER.lng,
          error: error.code === 1 ? 'denied' : 'unavailable',
          loading: false,
        }));
      },
      {
        timeout,
        enableHighAccuracy,
      }
    );

    return () => clearTimeout(timeoutId);
  }, [options.timeout, options.enableHighAccuracy]);

  return location;
}
