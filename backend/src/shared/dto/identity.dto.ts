import { UserRole } from '../constants/roles.constant';

export interface IdentityDto {
  userId: string;
  userName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}
