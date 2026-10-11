import { Routes } from '@angular/router';
import { PermissionEnum } from '../../core/constants/permission.enum';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'New application - TechKraft',
    canActivate: [permissionGuard(PermissionEnum.application_create)],
    loadComponent: () => import('./components/wizard.component').then((m) => m.WizardComponent),
  },
];