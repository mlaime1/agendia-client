import { CalendarDay } from '../types';
import {
  getClientMonthDays,
  getClientLeadingEmptyCells,
  getClientMonthLabelFromDate,
  getClientLongDateLabelFromDate,
  getClientToday,
  isSameDay as isSameClientDay,
  toDateKey as toClientDateKey,
} from '../../../utils/dateTime';

const pad = (value: number) => value.toString().padStart(2, '0');

export const toDateKey = (date: Date, clientTimezone?: string) =>
  clientTimezone
    ? toClientDateKey(date, clientTimezone)
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const isSameDay = (left: Date, right: Date, clientTimezone?: string) =>
  clientTimezone
    ? isSameClientDay(left, right, clientTimezone)
    : left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate();

const monthLabels = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const getMonthLabel = (date: Date, clientTimezone?: string) =>
  clientTimezone
    ? getClientMonthLabelFromDate(date, clientTimezone)
    : `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;

export const getLongDateLabel = (date: Date, clientTimezone?: string) =>
  clientTimezone
    ? getClientLongDateLabelFromDate(date, clientTimezone)
    : date.toLocaleDateString('es-AR', { weekday: 'long', month: 'long', day: 'numeric' });

export const getMonthDays = (monthDate: Date, clientTimezone?: string): CalendarDay[] => {
  if (clientTimezone) {
    return getClientMonthDays(monthDate, clientTimezone);
  }

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  return Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(year, month, index + 1);

    return {
      date,
      dateKey: toDateKey(date),
      dayNumber: index + 1,
      isToday: isSameDay(date, today),
    };
  });
};

export const getLeadingEmptyCells = (monthDate: Date, clientTimezone?: string) => {
  if (clientTimezone) {
    return getClientLeadingEmptyCells(monthDate, clientTimezone);
  }

  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  return firstDay.getDay();
};
