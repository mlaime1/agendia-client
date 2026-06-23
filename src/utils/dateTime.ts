import { format, getDate, getDay, getMonth, getYear } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const getClientTimezone = (client?: { timezone?: string | null } | null): string =>
  client?.timezone || DEFAULT_TIMEZONE;

// Convert a UTC ISO string to a Date object representing the client's local time
export const toClientDate = (utcString: string, clientTimezone?: string): Date =>
  toZonedTime(new Date(utcString), clientTimezone || DEFAULT_TIMEZONE);

// Format a UTC ISO string as a date label (dd/MM/yyyy) in client's timezone
export const formatClientDate = (utcString: string, clientTimezone?: string): string =>
  format(toClientDate(utcString, clientTimezone), 'dd/MM/yyyy');

// Format a UTC ISO string as a time label (HH:mm) in client's timezone
export const formatClientTime = (utcString: string, clientTimezone?: string): string =>
  format(toClientDate(utcString, clientTimezone), 'HH:mm');

// Get date key (YYYY-MM-DD) in client's timezone from a UTC ISO string
export const getClientDateKey = (utcString: string, clientTimezone?: string): string => {
  const zoned = toClientDate(utcString, clientTimezone);
  return `${getYear(zoned)}-${String(getMonth(zoned) + 1).padStart(2, '0')}-${String(
    getDate(zoned),
  ).padStart(2, '0')}`;
};

// Get day of week in client's timezone (0=Sunday, 1=Monday, ...)
export const getClientDayOfWeek = (utcString: string, clientTimezone?: string): number =>
  getDay(toClientDate(utcString, clientTimezone));

// Check if two UTC strings represent the same day in client's timezone
export const isSameClientDay = (
  leftUtc: string,
  rightUtc: string,
  clientTimezone?: string,
): boolean => {
  const left = toClientDate(leftUtc, clientTimezone);
  const right = toClientDate(rightUtc, clientTimezone);
  return getYear(left) === getYear(right) && getMonth(left) === getMonth(right) && getDate(left) === getDate(right);
};

// Check if a UTC string is in the same month/year as a local reference in client's timezone
export const isSameClientMonth = (
  utcString: string,
  monthDate: Date,
  clientTimezone?: string,
): boolean => {
  const zoned = toClientDate(utcString, clientTimezone);
  return getYear(zoned) === getYear(monthDate) && getMonth(zoned) === getMonth(monthDate);
};

// Get month label (e.g., "Junio 2026") in client's timezone
export const getClientMonthLabel = (date: Date, clientTimezone?: string): string =>
  formatInTimeZone(date, clientTimezone || DEFAULT_TIMEZONE, "MMMM yyyy", { locale: { code: 'es' } as any });

// Get long date label (e.g., "15/06/2026") in client's timezone
export const getClientLongDateLabel = (date: Date, clientTimezone?: string): string =>
  formatInTimeZone(date, clientTimezone || DEFAULT_TIMEZONE, 'dd/MM/yyyy');

// Get today's date in client's timezone
export const getClientToday = (clientTimezone?: string): Date =>
  toZonedTime(new Date(), clientTimezone || DEFAULT_TIMEZONE);

// Get month days for calendar grid in client's timezone
export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
};

export const getClientMonthDays = (monthDate: Date, clientTimezone?: string): CalendarDay[] => {
  const tz = clientTimezone || DEFAULT_TIMEZONE;
  const zonedMonth = toZonedTime(monthDate, tz);
  const year = getYear(zonedMonth);
  const month = getMonth(zonedMonth);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = getClientToday(tz);

  return Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = formatInTimeZone(date, tz, 'yyyy-MM-dd');
    const zonedDate = toZonedTime(date, tz);

    return {
      date,
      dateKey,
      dayNumber: index + 1,
      isToday:
        getYear(zonedDate) === getYear(today) &&
        getMonth(zonedDate) === getMonth(today) &&
        getDate(zonedDate) === getDate(today),
    };
  });
};

export const getClientLeadingEmptyCells = (monthDate: Date, clientTimezone?: string): number => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  return getDay(toZonedTime(firstDay, clientTimezone || DEFAULT_TIMEZONE));
};

export const toDateKey = (date: Date, clientTimezone?: string): string =>
  formatInTimeZone(date, clientTimezone || DEFAULT_TIMEZONE, 'yyyy-MM-dd');

export const isSameDay = (left: Date, right: Date, clientTimezone?: string): boolean => {
  const tz = clientTimezone || DEFAULT_TIMEZONE;
  const l = toZonedTime(left, tz);
  const r = toZonedTime(right, tz);
  return getYear(l) === getYear(r) && getMonth(l) === getMonth(r) && getDate(l) === getDate(r);
};

// Parse a simple date key (YYYY-MM-DD) to a Date at midnight in client's timezone
export const parseClientDateKey = (dateKey: string, clientTimezone?: string): Date =>
  toZonedTime(new Date(`${dateKey}T00:00:00`), clientTimezone || DEFAULT_TIMEZONE);

// Format a UTC string to a period label (dd/MM/yyyy — dd/MM/yyyy)
export const formatClientPeriod = (
  startUtc: string,
  endUtc: string,
  clientTimezone?: string,
): string =>
  `${formatClientDate(startUtc, clientTimezone)} — ${formatClientDate(endUtc, clientTimezone)}`;

// Format day header (e.g., "Lunes 15/06") from a UTC string
export const formatClientDayHeader = (utcString: string, clientTimezone?: string): string => {
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const zoned = toClientDate(utcString, clientTimezone);
  const weekday = weekdays[getDay(zoned)];
  const shortDate = format(zoned, 'dd/MM');
  return `${weekday} ${shortDate}`;
};

// Format month label for calendar (e.g., "Junio 2026") from a Date
export const getClientMonthLabelFromDate = (date: Date, clientTimezone?: string): string => {
  const tz = clientTimezone || DEFAULT_TIMEZONE;
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const zoned = toZonedTime(date, tz);
  return `${months[getMonth(zoned)]} ${getYear(zoned)}`;
};

// Get long date label from a Date (e.g., "viernes, 12 de junio")
export const getClientLongDateLabelFromDate = (date: Date, clientTimezone?: string): string => {
  const zoned = toZonedTime(date, clientTimezone || DEFAULT_TIMEZONE);
  return zoned.toLocaleDateString('es-AR', { weekday: 'long', month: 'long', day: 'numeric' });
};
