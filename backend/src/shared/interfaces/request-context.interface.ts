import { UserRole } from '../constants/roles.constant';

export interface RequestContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}
