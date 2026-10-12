import { HttpRequest } from '@angular/common/http';
import { MockUser, users } from '../mock-db';
import { can, fail, ok, Reply } from '../mock-utils';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { RoleEnum } from '../../core/constants/role.enum';

const CREATED = '2026-01-01T09:00:00.000Z';
const toUser = (u: MockUser) => ({
  id: u.id,
  username: u.username,
  email: `${u.username}@techkraft.test`,
  roles: u.roles,
  createdAt: CREATED,
  updatedAt: CREATED,
});

export function handleUsers(req: HttpRequest<unknown>, path: string, user: MockUser): Reply | null {
  if (path === '/users' && req.method === 'GET') {
    const params = req.params;
    const role = params.get('role');
    const byRole = users.filter((u) => !role || u.roles.includes(role as RoleEnum));

    // Plain list (no paging params): reviewer picker, needs assign permission.
    if (!params.has('page')) {
      if (!can(user, PermissionEnum.application_assign)) return fail(403, 'Forbidden');
      return ok(byRole.map((u) => ({ id: u.id, username: u.username })));
    }

    if (!can(user, PermissionEnum.user_manage)) return fail(403, 'Forbidden');
    const page = Math.max(1, Number(params.get('page')));
    const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize') ?? 10)));
    const q = params.get('q')?.toLowerCase();
    const sort = (params.get('sort') ?? 'username') as keyof ReturnType<typeof toUser>;
    const dir = params.get('dir') === 'desc' ? -1 : 1;
    const rows = byRole
      .map(toUser)
      .filter((u) => !q || u.username.includes(q) || u.email.includes(q))
      .sort((a, b) => (a[sort]! > b[sort]! ? dir : a[sort]! < b[sort]! ? -dir : 0));
    return ok({
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      pageSize,
    });
  }

  const match = path.match(/^\/users\/([^/]+)(\/role)?$/);
  if (match) {
    if (!can(user, PermissionEnum.user_manage)) return fail(403, 'Forbidden');
    const target = users.find((u) => u.id === match[1]);
    if (!target) return fail(404, 'User not found');
    if (!match[2] && req.method === 'GET') return ok(toUser(target));
    if (match[2] && req.method === 'PATCH') {
      const role = (req.body as { role?: string })?.role as RoleEnum;
      if (!Object.values(RoleEnum).includes(role)) return fail(400, 'Invalid role');
      target.roles = [role];
      return ok(toUser(target));
    }
  }

  return null;
}
