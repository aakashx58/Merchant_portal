import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { PermissionEnum } from '../core/constants/permission.enum';
import { RoleEnum } from '../core/constants/role.enum';
import { Application, HistoryEntry } from '../core/models/application.model';
import { hasPermission } from '../core/utils/permission.utils';
import { accessTokens, mask, MockUser, users } from './mock-db';

export interface Reply {
  status: number;
  body?: unknown;
  headers?: HttpHeaders;
}

export const ok = (body: unknown, headers?: HttpHeaders): Reply => ({ status: 200, body, headers });
export const fail = (status: number, message: string): Reply => ({ status, body: { message } });
export const etag = (application: Application) => new HttpHeaders({ ETag: `"${application.version}"` });

export function currentUser(req: HttpRequest<unknown>): MockUser | undefined {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const id = token && accessTokens.get(token);
  return users.find((user) => user.id === id);
}

export const can = (user: MockUser, permission: PermissionEnum) => hasPermission(user.roles, permission);
export const isAdmin = (user: MockUser) => user.roles.includes(RoleEnum.admin);
export const canSee = (user: MockUser, application: Application) =>
  can(user, PermissionEnum.application_view_all) ||
  (can(user, PermissionEnum.application_view_own) && application.ownerId === user.id) ||
  (can(user, PermissionEnum.application_view_assigned) && application.assigneeId === user.id);
export const canEdit = (user: MockUser, application: Application) =>
  can(user, PermissionEnum.application_edit) && (application.ownerId === user.id || isAdmin(user));

export const log = (
  application: Application,
  user: MockUser,
  action: HistoryEntry['action'],
  extra: Partial<HistoryEntry> = {},
) =>
  application.history.push({
    at: new Date().toISOString(),
    actorId: user.id,
    actorName: user.username,
    action,
    ...extra,
  });

export const touch = (application: Application) => {
  application.version++;
  application.updatedAt = new Date().toISOString();
  return ok(mask(application), etag(application));
};
