import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.ROUTES),
  },
  {
    path: 'wizard',
    loadChildren: () => import('./features/wizard/wizard.routes').then((m) => m.ROUTES),
  },
  {
    path: 'review',
    loadChildren: () => import('./features/review/review.routes').then((m) => m.ROUTES),
  },
];
