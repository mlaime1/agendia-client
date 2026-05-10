import { CalendarDay } from '../types';

const pad = (value: number) => value.toString().padStart(2, '0');

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('en', { month: 'long', year: 'numeric' });

export const getMonthDays = (monthDate: Date): CalendarDay[] => {
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

export const getLeadingEmptyCells = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

  return firstDay.getDay();
};
