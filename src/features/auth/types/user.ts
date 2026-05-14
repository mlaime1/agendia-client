export type UserRole = 'driver' | 'admin' | 'client';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  alias: string | null;
  role: UserRole;
};
