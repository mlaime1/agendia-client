import type { UserRole } from '../auth/types/user';

export type ProfileSection = 'personal' | 'workingDays' | 'preferences' | 'stats';

export interface ProfileScreenProps {
  userProfile: {
    id: string;
    name: string;
    email: string;
    alias: string | null;
    role: UserRole;
    phone?: string | null;
  };
  onMenuPress: () => void;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
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
