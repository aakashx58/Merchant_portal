import { HttpRequest } from '@angular/common/http';
import { MockUser, users } from '../mock-db';
import { can, fail, ok, Reply } from '../mock-utils';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { RoleEnum } from '../../core/constants/role.enum';

export function handleUsers(req: HttpRequest<unknown>, path: string, user: MockUser): Reply | null {
  if (path === '/users' && req.method === 'GET') {
    if (!can(user, PermissionEnum.application_assign)) return fail(403, 'Forbidden');
    const role = req.params.get('role');
    return ok(
      users
        .filter((userItem) => !role || userItem.roles.includes(role as RoleEnum))
        .map((userItem) => ({ id: userItem.id, username: userItem.username })),
    );
  }

  return null;
}
