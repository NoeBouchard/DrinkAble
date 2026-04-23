/**
 * Lightweight telemetry: console.log with stable tag prefixes.
 * We read these from tester devtools today. Swap the implementation
 * here when we wire up real analytics.
 */

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

export function track(event, payload) {
  const tag = `[${PREFIX}${event}]`;
  if (payload === undefined) {
    console.log(tag);
  } else {
    console.log(tag, payload);
  }
}

export default { track, Events };
