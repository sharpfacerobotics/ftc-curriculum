export type AnalyticsEventName =
  | 'login'
  | 'sign_up'
  | 'lesson_complete'
  | 'lesson_unmark'
  | 'unit_complete'
  | 'unit_skip'
  | 'unit_review'
  | 'unit_unmark'
  | 'simulator_launch'
  | 'simulator_fullscreen'
  | 'content_lock_view'
  | 'content_unlock_attempt'
  | 'content_unlock_success'
  | 'simulator_gate_request';

type AnalyticsParameters = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: AnalyticsEventName,
      parameters?: AnalyticsParameters,
    ) => void;
  }
}

export function trackEvent(
  eventName: AnalyticsEventName,
  parameters: AnalyticsParameters = {},
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, parameters);
}
