import { RoleEnum } from '../enums/role.enum';
import { PermissionEnum } from '../enums/permission.enum';

/**
 * Static mapping of roles to their granted permissions.
 * This is the single source of truth for RBAC access control.
 */
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionEnum[]> = {
  [RoleEnum.sales]: [
    PermissionEnum.application_create,
    PermissionEnum.application_edit,
    PermissionEnum.application_view_own,
  ],
  [RoleEnum.reviewer]: [
    PermissionEnum.application_view_assigned,
    PermissionEnum.application_review,
    PermissionEnum.sensitive_reveal,
  ],
  [RoleEnum.admin]: [
    PermissionEnum.application_create,
    PermissionEnum.application_edit,
    PermissionEnum.application_view_own,
    PermissionEnum.application_view_all,
    PermissionEnum.application_assign,
    PermissionEnum.sensitive_reveal,
    PermissionEnum.dashboard_counts,
  ],
};
