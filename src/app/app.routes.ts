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
    path: 'unauthorized',
    title: 'Access Denied - TechKraft',
    loadChildren: () => import('./features/error-pages/error-pages.routes').then((m) => m.ROUTES),
  },
  {
    path: 'error',
    title: 'Error - TechKraft',
    loadComponent: () =>
      import('./features/error-pages/server-error/server-error.component').then(
        (m) => m.ServerErrorComponent,
      ),
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
      {
        path: 'review-queue',
        title: 'Review Queue - TechKraft',
        canActivate: [permissionGuard(PermissionEnum.application_view_assigned)],
        loadChildren: () => import('./features/review/review.routes').then((m) => m.ROUTES),
      },
      {
        path: 'admin',
        title: 'Admin - TechKraft',
        canActivate: [permissionGuard(PermissionEnum.user_manage)],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ROUTES),
      },
      {
        path: 'audit-log',
        title: 'Audit Log - TechKraft',
        canActivate: [permissionGuard(PermissionEnum.dashboard_counts)],
        loadChildren: () => import('./features/audit-log/audit-log.routes').then((m) => m.ROUTES),
      },
    ],
  },
  {
    path: '**',
    title: 'Not Found - TechKraft',
    loadComponent: () =>
      import('./features/error-pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
