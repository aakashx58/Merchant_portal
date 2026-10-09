import { Routes } from '@angular/router';
import { PermissionEnum } from './core/enums/permission.enum';
import { authGuard, permissionGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.ROUTES),
      },
      {
        path: 'wizard',
        canActivate: [permissionGuard(PermissionEnum.application_create)],
        loadChildren: () => import('./features/wizard/wizard.routes').then((m) => m.ROUTES),
      },
      {
        path: 'review',
        canActivate: [permissionGuard(PermissionEnum.application_review)],
        loadChildren: () => import('./features/review/review.routes').then((m) => m.ROUTES),
      },
    ],
  },
];
