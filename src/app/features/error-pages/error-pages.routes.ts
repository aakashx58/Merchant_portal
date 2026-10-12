import { Routes } from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'unauthorized',
    title: 'Access Denied - TechKraft',
    loadComponent: () =>
      import('./unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: 'not-found',
    title: 'Not Found - TechKraft',
    loadComponent: () => import('./not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
