/**
 * Defines the granular permissions available in the TechKraft platform.
 * Permissions are assigned to roles via ROLE_PERMISSIONS and checked at runtime.
 */
export enum PermissionEnum {
  /** Create a new loan/payment application. */
  application_create = 'application_create',

  /** Edit an existing application (own or assigned). */
  application_edit = 'application_edit',

  /** View only the applications created by the current user. */
  application_view_own = 'application_view_own',

  /** View only the applications assigned to the current reviewer. */
  application_view_assigned = 'application_view_assigned',

  /** View all applications across all users. */
  application_view_all = 'application_view_all',

  /** Review and approve/reject submitted applications. */
  application_review = 'application_review',

  /** Assign an application to another user or reviewer. */
  application_assign = 'application_assign',

  /** Reveal masked sensitive fields (e.g. account numbers, NID). */
  sensitive_reveal = 'sensitive_reveal',

  /** View aggregate counts and metrics on the dashboard. */
  dashboard_counts = 'dashboard_counts',

  /** Manage users (create, update, delete, assign roles). */
  user_manage = 'user_manage',
}
