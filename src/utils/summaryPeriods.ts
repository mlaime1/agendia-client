import type { Summary } from '../services/types';
import { getClientDateKey } from './dateTime';

export type ClosedSummaryPeriod = {
  start: string;
  end: string;
  status: 'paid' | 'archived';
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toPeriodDateKey = (value: string, clientTimezone?: string): string =>
  DATE_ONLY_PATTERN.test(value) ? value : getClientDateKey(value, clientTimezone);

export const getClosedSummaryPeriods = (
  summaries: Summary[],
  clientTimezone?: string,
): ClosedSummaryPeriod[] => summaries
  .filter((summary): summary is Summary & { status: 'paid' | 'archived' } =>
    summary.status === 'paid' || summary.status === 'archived')
  .map((summary) => ({
    start: toPeriodDateKey(summary.period_start, clientTimezone),
    end: toPeriodDateKey(summary.period_end, clientTimezone),
    status: summary.status,
  }))
  .filter((period) => period.start <= period.end);

export const findClosedSummaryPeriod = (
  dateKey: string,
  periods: ClosedSummaryPeriod[],
): ClosedSummaryPeriod | undefined => periods.find(
  (period) => dateKey >= period.start && dateKey <= period.end,
);

export const rangeIntersectsClosedSummary = (
  start: string,
  end: string,
  periods: ClosedSummaryPeriod[],
): boolean => periods.some((period) => period.start <= end && period.end >= start);
