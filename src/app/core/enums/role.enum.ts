/**
 * Defines the user roles available in the TechKraft platform.
 * Each role represents a distinct job function with a specific set of permissions.
 */
export enum RoleEnum {
  /** Can create and manage their own loan/payment applications. */
  sales = 'sales',

  /** Can view all applications, review submissions, and access sensitive data. */
  reviewer = 'reviewer',

  /** Full access — manages users, assigns roles, and has all platform permissions. */
  admin = 'admin',
}
