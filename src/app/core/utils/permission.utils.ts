import { RoleEnum } from '../enums/role.enum';
import { PermissionEnum } from '../enums/permission.enum';
import { ROLE_PERMISSIONS } from '../config/role-permissions.config';

/**
 * Returns the full set of permissions for a given list of roles.
 * Handles users who may have multiple roles (e.g. admin also has reviewer rights).
 */
export function resolvePermissions(roles: RoleEnum[]): Set<PermissionEnum> {
  const permissions = new Set<PermissionEnum>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      permissions.add(permission);
    }
  }
  return permissions;
}

/**
 * Checks if a given set of roles includes a specific permission.
 */
export function hasPermission(roles: RoleEnum[], permission: PermissionEnum): boolean {
  return resolvePermissions(roles).has(permission);
}
