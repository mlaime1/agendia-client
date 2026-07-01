import { api } from './backendApi';
import type {
  CreateInvitationDto,
  Invitation,
  InvitationCodeResult,
} from './types';

export const invitationsService = {
  create(body: CreateInvitationDto): Promise<InvitationCodeResult> {
    return api.post<InvitationCodeResult>('/invitations', body);
  },

  list(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/invitations');
  },

  validate(code: string): Promise<{ valid: boolean; client_id: string | null }> {
    return api.get<{ valid: boolean; client_id: string | null }>(`/invitations/${code}`);
  },
};
