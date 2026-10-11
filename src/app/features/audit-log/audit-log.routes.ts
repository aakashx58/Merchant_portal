import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionEnum } from '../../core/constants/permission.enum';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Audit Log - TechKraft',
    canActivate: [permissionGuard(PermissionEnum.dashboard_counts)], // Reuse dashboard_counts for now
    loadComponent: () =>
      import('./components/audit-log.component').then((m) => m.AuditLogComponent),
  },
];