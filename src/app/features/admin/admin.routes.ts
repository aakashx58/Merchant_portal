import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionEnum } from '../../core/constants/permission.enum';

export const ROUTES: Routes = [
  {
    path: 'assignments',
    title: 'Application Assignments - TechKraft',
    canActivate: [permissionGuard(PermissionEnum.application_assign)],
    loadComponent: () =>
      import('./components/admin-assignments/admin-assignments.component').then(
        (m) => m.AdminAssignmentsComponent,
      ),
  },
  {
    path: 'users',
    title: 'User Management - TechKraft',
    canActivate: [permissionGuard(PermissionEnum.user_manage)],
    loadComponent: () =>
      import('./components/user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
  },
];