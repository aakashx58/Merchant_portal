import { Routes } from '@angular/router';
import { PermissionEnum } from './core/constants/permission.enum';
import { authGuard } from './core/guards/auth.guard';
import { routeGuard } from './core/guards/route.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in - TechKraft',
    canActivate: [routeGuard],
    loadComponent: () =>
      import('./features/auth/components/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/app-layout.component').then((m) => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard - TechKraft',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.ROUTES),
      },
      {
        path: 'wizard',
        title: 'New application - TechKraft',
        canActivate: [permissionGuard(PermissionEnum.application_create)],
        loadChildren: () => import('./features/wizard/wizard.routes').then((m) => m.ROUTES),
      },
    ],
  },
];
