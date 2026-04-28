/**
 * Telemetry: console.log with stable tag prefixes (kept verbatim so existing
 * tester-devtools workflows keep working) plus a fire-and-forget POST to
 * /api/track which forwards to the analytics webhook.
 *
 * Network failures NEVER bubble — telemetry must not break the UI.
 */

import { getSessionId } from './session';

const PREFIX = 'drinkable:';

export const Events = Object.freeze({
  ONBOARDING_STARTED: 'onboarding_started',
  Q1_SUBMITTED: 'onboarding_q1_submitted',
  Q2_SUBMITTED: 'onboarding_q2_submitted',
  LOCATION_GRANTED: 'location_granted',
  LOCATION_DENIED: 'location_denied',
  FIRST_RECOMMENDATION_RECEIVED: 'first_recommendation_received',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FEATURE_INTEREST_SUBMITTED: 'feature_interest_submitted',
  FEATURE_INTEREST_SKIPPED: 'feature_interest_skipped',
  ADVISOR_QUERY_SUBMITTED: 'advisor_query_submitted',
  GOOGLE_MAPS_OPENED: 'google_maps_opened',
  BROWSE_VIEW_OPENED: 'browse_view_opened',
});

function forward(event, payload) {
  try {
    const ua =
      typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
    const body = {
      tab: 'events',
      row: [
        new Date().toISOString(),
        getSessionId(),
        event,
        JSON.stringify(payload || {}),
        ua,
      ],
    };
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => { /* swallow */ });
  } catch {
    /* never bubble */
  }
}

export function track(event, payload) {
  const tag = `[${PREFIX}${event}]`;
  if (payload === undefined) {
    console.log(tag);
  } else {
    console.log(tag, payload);
  }
  forward(event, payload);
}

export default { track, Events };
