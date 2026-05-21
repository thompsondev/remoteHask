import { SetMetadata } from '@nestjs/common';

import type { SystemRole } from '../../database/enums';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: SystemRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
