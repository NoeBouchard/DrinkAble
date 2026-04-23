/**
 * Tiny safe localStorage wrapper.
 *
 * Why: Safari private mode and embedded webviews can throw on every
 * localStorage access. This module swallows those errors so the app
 * still renders — features that depend on persistence simply degrade
 * to "session-only" behaviour.
 */

const KEYS = Object.freeze({
  ONBOARDED: 'drinkable_onboarded',
  PREFERENCES: 'drinkable_preferences',
  FEATURE_INTEREST: 'drinkable_feature_interest',
  TESTER_EMAIL: 'drinkable_tester_email',
  LOCATION_PERMISSION: 'drinkable_location_permission',
  RECENT_RECOMMENDATIONS: 'drinkable_recent_recommendations',
});

const RECENT_CAP = 10;

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* no-op: private browsing, quota, etc. */
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

function getJSON(key, fallback = null) {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setJSON(key, value) {
  try {
    safeSet(key, JSON.stringify(value));
  } catch {
    /* no-op */
  }
}

export const storage = {
  KEYS,

  // Onboarding
  isOnboarded() {
    return safeGet(KEYS.ONBOARDED) === 'true';
  },
  setOnboarded() {
    safeSet(KEYS.ONBOARDED, 'true');
  },
  resetOnboarded() {
    safeRemove(KEYS.ONBOARDED);
  },

  // Preferences
  getPreferences() {
    return getJSON(KEYS.PREFERENCES, { drinks: [], priorities: [], completedAt: null });
  },
  setPreferences(prefs) {
    setJSON(KEYS.PREFERENCES, prefs);
  },

  // Feature interest survey
  getFeatureInterest() {
    return getJSON(KEYS.FEATURE_INTEREST, []);
  },
  setFeatureInterest(arr) {
    setJSON(KEYS.FEATURE_INTEREST, arr);
  },

  // Tester email (optional contact)
  getTesterEmail() {
    return safeGet(KEYS.TESTER_EMAIL) || '';
  },
  setTesterEmail(email) {
    if (email) safeSet(KEYS.TESTER_EMAIL, email);
    else safeRemove(KEYS.TESTER_EMAIL);
  },

  // Location permission outcome
  getLocationPermission() {
    return safeGet(KEYS.LOCATION_PERMISSION); // 'granted' | 'denied' | null
  },
  setLocationPermission(value) {
    if (value === 'granted' || value === 'denied') {
      safeSet(KEYS.LOCATION_PERMISSION, value);
    }
  },

  // Recent recommendations log (most recent first, capped)
  getRecentRecommendations() {
    const items = getJSON(KEYS.RECENT_RECOMMENDATIONS, []);
    return Array.isArray(items) ? items : [];
  },
  pushRecentRecommendation(entry) {
    if (!entry) return;
    const next = [entry, ...storage.getRecentRecommendations()].slice(0, RECENT_CAP);
    setJSON(KEYS.RECENT_RECOMMENDATIONS, next);
  },

  // Test helper — clears every Drinkable key
  clearAll() {
    Object.values(KEYS).forEach(safeRemove);
  },
};

export default storage;
