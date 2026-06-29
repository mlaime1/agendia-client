export type UserRole = 'driver' | 'admin' | 'client';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  alias: string | null;
  role: UserRole;
  linked_client_id?: string | null;
  timezone?: string | null;
};
