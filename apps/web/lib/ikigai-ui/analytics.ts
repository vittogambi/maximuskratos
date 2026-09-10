export type IkigaiAnalyticsEvent =
  | 'item_added'
  | 'item_removed'
  | 'qualifier_selected'
  | 'help_opened'
  | 'idea_library_opened'
  | 'idea_adopted'
  | 'hypothesis_builder_started'
  | 'hypothesis_saved'
  | 'no_hypothesis_selected'
  | 'contrast_started'
  | 'contrast_completed'
  | 'result_viewed'
  | 'experiment_saved';

export function trackIkigai(
  event: IkigaiAnalyticsEvent,
  props?: Record<string, string | number | boolean | null>,
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('mk:ikigai', { detail: { event, ...(props ?? {}) } }));
}
