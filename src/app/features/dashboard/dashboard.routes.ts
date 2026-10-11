import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    title: 'Dashboard - TechKraft',
    loadComponent: () =>
      import('./components/dashboard.component').then((m) => m.DashboardComponent),
  },
];
