export type UserRole = 'driver' | 'admin' | 'client' | 'unknown';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  alias: string | null;
  role: UserRole;
  linked_client_id?: string | null;
  timezone?: string | null;
  phone?: string | null;
};
