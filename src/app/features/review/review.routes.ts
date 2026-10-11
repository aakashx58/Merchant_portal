import { Routes } from '@angular/router';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Review Queue - TechKraft',
    canActivate: [permissionGuard(PermissionEnum.application_view_assigned)],
    loadComponent: () =>
      import('./components/review-queue/review-queue.component').then((m) => m.ReviewQueueComponent),
  },
];