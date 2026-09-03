import { api } from './backendApi';
import type { UpdateUserDto } from './types';
import type { UserProfile } from '../features/auth/types/user';

export const usersService = {
  updateMe(body: UpdateUserDto): Promise<UserProfile> {
    return api.patch<UserProfile>('/users/me', body);
  },
};
