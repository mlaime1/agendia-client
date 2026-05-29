export type ProfileSection = 'personal' | 'workingDays' | 'preferences' | 'stats';

export interface ProfileScreenProps {
  userProfile: {
    id: string;
    name: string;
    email: string;
    alias: string | null;
    role: 'driver' | 'admin' | 'client';
  };
  onMenuPress: () => void;
}

export interface WorkingDaysData {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}
