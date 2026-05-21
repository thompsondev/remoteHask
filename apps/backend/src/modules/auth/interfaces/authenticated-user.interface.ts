import type { SystemRole } from '../../../database/enums';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  orgId: string | null;
  roles: SystemRole[];
  permissions: string[];
  mfa: boolean;
}
