import { Routes } from '@angular/router';
import { PermissionEnum } from './core/enums/permission.enum';
import { AppLayoutComponent } from './shared/layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { routeGuard } from './core/guards/route.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [routeGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
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
