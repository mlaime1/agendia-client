export type TripMode = 'outbound' | 'roundTrip' | 'special';

export type Trip = {
  id: string;
  date: string;
  time: string;
  mode: TripMode;
  specialType?: string;
  note?: string;
};

export type TripUpdates = Partial<Pick<Trip, 'time' | 'mode' | 'note' | 'specialType'>>;

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
};

export type PendingSpecialTrip = {
  dateKey: string;
  specialType: string;
  note: string;
};
