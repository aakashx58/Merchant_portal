import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  { path: '', loadComponent: () => import('./dashboard').then((m) => m.Dashboard) },
];
