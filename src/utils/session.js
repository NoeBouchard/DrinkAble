/**
 * Session id helper.
 *
 * Persists a UUID per browser in localStorage so we can stitch tester events
 * across reloads. Falls back to an in-memory id if storage throws (private
 * browsing, embedded webviews, etc.) — same try/catch pattern as storage.js.
 */

const KEY = 'drinkable_session_id';

let memoryId = null;

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId() {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const next = uuid();
    window.localStorage.setItem(KEY, next);
    return next;
  } catch {
    if (!memoryId) memoryId = uuid();
    return memoryId;
  }
}

export default { getSessionId };
