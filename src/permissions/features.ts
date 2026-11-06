/**
 * Kill switches for product areas that are temporarily unavailable.
 *
 * Flip a flag back to `true` to reopen the area. Nothing else has to change:
 * the code path stays in place and only its entry point is hidden.
 */
export const FEATURE_FLAGS = {
  /**
   * Automatic summaries are blocked while the period logic is being rethought.
   *
   * The generated summary was issued and could not be edited afterwards, so
   * clients that only paid a couple of days were stuck with a closed period.
   * Manual summaries stay available: they are the workflow in use meanwhile.
   */
  autoSummaries: false,
} as const;
